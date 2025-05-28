// src/components/CourseForm.js
import React, { useState } from 'react';
import { createCourse, updateCourse } from '../services/dataApi';
import './CourseForm.css';

const CourseForm = ({ course, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        title: course?.title || '',
        description: course?.description || ''
    });
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [selectedThumbnail, setSelectedThumbnail] = useState(null);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files.length > 0) {
            switch (name) {
                case 'video':
                    setSelectedVideo(files[0]);
                    break;
                case 'thumbnail':
                    setSelectedThumbnail(files[0]);
                    break;
                case 'modulePdf':
                    setSelectedPdf(files[0]);
                    break;
                default:
                    break;
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            
            if (selectedVideo) {
                formDataToSend.append('videoFile', selectedVideo);
            }
            if (selectedThumbnail) {
                formDataToSend.append('thumbnailFile', selectedThumbnail);
            }
            if (selectedPdf) {
                formDataToSend.append('modulePdfFile', selectedPdf);
            }

            const response = course
                ? await updateCourse(course.id, formDataToSend)
                : await createCourse(formDataToSend);

            if (response.status === 200 || response.status === 201) {
                if (onSave) {
                    await onSave();
                }
            }
        } catch (err) {
            console.error('Error saving course:', err);
            setError(err.response?.data?.message || 'Failed to save course. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="course-form-overlay">
            <div className="course-form-container">
                <h2>{course ? 'Edit Course' : 'Create New Course'}</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Course Title</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="Enter course title"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            placeholder="Enter course description"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="video">Course Video</label>
                        <input
                            type="file"
                            id="video"
                            name="video"
                            onChange={handleFileChange}
                            accept="video/*"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="thumbnail">Course Thumbnail</label>
                        <input
                            type="file"
                            id="thumbnail"
                            name="thumbnail"
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="modulePdf">Course Materials (PDF)</label>
                        <input
                            type="file"
                            id="modulePdf"
                            name="modulePdf"
                            onChange={handleFileChange}
                            accept=".pdf"
                        />
                    </div>

                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="button button-secondary" 
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="button button-primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : (course ? 'Update Course' : 'Create Course')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CourseForm;