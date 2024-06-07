import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fetch from "node-fetch";

// Optional: If you'd like to use the new headless mode. "shell" is the default.
// NOTE: Because we build the shell binary, this option does not work.
//       However, this option will stay so when we migrate to full chromium it will work.
chromium.setHeadlessMode = true;

const wait = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

export const handler = async () => {
  const client = new S3Client({ region: "eu-west-2" });

  try {
    // check if there's actually anything there - if not, don't bother
    const isEmptyRes = await fetch("https://doodle.recurse.com/is-empty").then(
      (res) => res.text()
    );

    if (isEmptyRes === "true") {
      console.log("Nothing on the canvas, nothing to do!");
      return;
    }

    // Initialise browser
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(
        "/opt/nodejs/node_modules/@sparticuz/chromium/bin"
      ),
      headless: chromium.headless,
    });

    // Go the page
    const page = await browser.newPage();
    await page.goto("https://doodle.recurse.com");

    // Wait so the canvas can get set up properly first
    await wait(3000);

    // Convert image to string
    const imageURL = await page.$eval("canvas", (el) => el.toDataURL());

    console.log("Got image URL", imageURL);

    const buf = Buffer.from(
      imageURL.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const isoTimeDate = new Date().toISOString();

    // Store image in S3 with timestamp as key
    await client.send(
      new PutObjectCommand({
        Bucket: "doodle-images",
        Key: isoTimeDate,
        Body: buf,
        ContentEncoding: "base64",
        ContentType: "image/jpeg",
      })
    );

    // Update the image file list so the gallery knows what to load
    const imageListKey = "imagelist.json";

    const file = await client.send(
      new GetObjectCommand({ Bucket: "doodle-images", Key: imageListKey })
    );

    const imageList = JSON.parse(await file.Body!.transformToString());

    console.log("Retrieved image list");

    imageList.push(isoTimeDate);

    await client.send(
      new PutObjectCommand({
        Bucket: "doodle-images",
        Key: imageListKey,
        Body: JSON.stringify(imageList),
        ContentType: "application/json",
      })
    );

    console.log("Updated image list. Resetting canvas!");

    // 🥲 fresh new canvas time
    await fetch("https://doodle.recurse.com/set-canvas", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Apparently this might be needed to stop it hanging sometimes
    for (const page of await browser.pages()) {
      await page.close();
    }
    await browser.close();
  } catch (e) {
    console.error(e);
    return JSON.stringify(e);
  }

  return "ok";
};
