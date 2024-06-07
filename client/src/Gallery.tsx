import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const S3_BASE_URL = 'https://doodle-images.s3.eu-west-2.amazonaws.com';

export const Gallery = () => {
    const [imageList, setImageList] = useState<string[] | undefined>(undefined);

    useEffect(() => {
        fetch(`${S3_BASE_URL}/imagelist.json`)
            .then((res) => res.json())
            .then((list) => setImageList(list.reverse()))
            .catch((e) => console.error(e));
    }, []);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            <h2 style={{ color: 'yellow' }}>Previous Doodles</h2>
            {/* todo: virtualise list */}
            {imageList ? (
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        width: '800px',
                        justifyContent: 'center',
                        gap: '32px',
                        margin: '16px',
                    }}
                >
                    {imageList.map((url) => (
                        <img
                            key={url}
                            src={`${S3_BASE_URL}/${encodeURIComponent(url)}`}
                            style={{
                                backgroundColor: 'white',
                                width: '40%',
                            }}
                        />
                    ))}
                </div>
            ) : (
                <p style={{ color: 'white' }}>Loading...</p>
            )}
            <Link to="/" style={{ color: 'white' }}>
                Back
            </Link>
        </div>
    );
};
