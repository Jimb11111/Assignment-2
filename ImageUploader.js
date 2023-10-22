import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL1 = "https://api-inference.huggingface.co/models/facebook/detr-resnet-50";
const API_URL2 = "https://api-inference.huggingface.co/models/google/vit-base-patch16-224";
const API_TOKEN = "YOUR API TOKEN";

function ModelForm({ apiUrl, apiToken, images, setImages, label, setLabel, loading, setLoading, error, setError, modelType }) {
    const canvasRefs = useRef([]);


    useEffect(() => {
        images.forEach((image, index) => {
            const canvas = canvasRefs.current[index];
            if (canvas) {
                const context = canvas.getContext('2d');
                const img = new Image();
                img.src = image.preview;
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    context.drawImage(img, 0, 0, img.width, img.height);
                    if (image.boxes) {
                        image.boxes.forEach(box => {
                            context.beginPath();
                            context.rect(box.xmin, box.ymin, box.xmax - box.xmin, box.ymax - box.ymin);
                            context.lineWidth = 7;
                            context.strokeStyle = 'red';
                            context.fillStyle = 'red';
                            context.stroke();
                        });
                    }
                };
            }
        });
    }, [images]);

    const handleImageUpload = event => {
        const files = Array.from(event.target.files);
        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            boxes: [],
            count: 0
        }));
        setImages(prevImages => [...prevImages, ...newImages]);
    };

    const handleLabelChange = event => {
        setLabel(event.target.value);
    };

    const handleSubmit = async event => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
            for (let i = 0; i < images.length; i++) {
                // Add a delay before each request
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                const image = images[i];
                const response = await axios.post(apiUrl, image.file, {
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                        'Content-Type': image.file.type
                    }
                });
                const data = response.data;
                if (modelType === 'model1') {
                    const boxes = data.filter(item => item.label === label).map(item => item.box);
                    const count = boxes.length;
                    images[i] = { ...image, boxes, count };
                } else if (modelType === 'model2') {
                    // Store the classifications and probabilities
                    const classifications = data.map(item => ({ label: item.label, probability: item.score }));
                    images[i] = { ...image, classifications };
                }
            }

            setImages([...images]);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    const handleSave = (image, index) => {
        const canvas = canvasRefs.current[index];
        const dataUrl = canvas.toDataURL();
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `image_${index}_bikes_${image.count}.png`;
        link.click();
    };
    return (
        <form onSubmit={handleSubmit}>
            <input type="file" onChange={handleImageUpload} multiple required />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                {images.map((image, index) => (
                    <div key={index}>
                        <canvas ref={el => canvasRefs.current[index] = el} style={{ maxWidth: '100%' }} />
                        {modelType === 'model1' && <p>Number of {label}s: {image.count}</p>}
                        {modelType === 'model2' && image.classifications && image.classifications.map((classification, index) => (
                            <p key={index}>{classification.label}:{classification.probability}</p>
                        ))}
                        <button
                            type="button"
                            onClick={() => handleSave(image, index)}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                transition: 'background-color 0.3s ease'
                            }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#45a049'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#4CAF50'}
                        >
                            Save
                        </button>
                    </div>
                ))}
            </div>
            {modelType === 'model1' && <input type="text" placeholder="Label to recognize" value={label} onChange={handleLabelChange} required />}
            <button
                type="submit"
                disabled={loading}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transition: 'background-color 0.3s ease'
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#45a049'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = '#4CAF50'}
            >
                Submit
            </button>
        </form>
    );
}

function ImageUploader() {
    const [activeTab, setActiveTab] = useState('model1');
    const [images1, setImages1] = useState([]);
    const [label1, setLabel1] = useState('');
    const [loading1, setLoading1] = useState(false);
    const [error1, setError1] = useState(null);

    const [images2, setImages2] = useState([]);
    const [loading2, setLoading2] = useState(false);
    const [error2, setError2] = useState(null);

    return (
        <div>
            <div>
                <button
                    onClick={() => setActiveTab('model1')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        transition: 'background-color 0.3s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#45a049'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#4CAF50'}
                >
                    Model 1
                </button>
                <button
                    onClick={() => setActiveTab('model2')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        transition: 'background-color 0.3s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#45a049'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#4CAF50'}
                >
                    Model 2
                </button>
            </div>
            {activeTab === 'model1' && <ModelForm apiUrl={API_URL1} apiToken={API_TOKEN} images={images1} setImages={setImages1} label={label1} setLabel={setLabel1} loading={loading1} setLoading={setLoading1} error={error1} setError={setError1} modelType='model1' />}
            {activeTab === 'model2' && <ModelForm apiUrl={API_URL2} apiToken={API_TOKEN} images={images2} setImages={setImages2} loading={loading2} setLoading={setLoading2} error={error2} setError={setError2} modelType='model2' />}
        </div>
    );
}

export default ImageUploader;
