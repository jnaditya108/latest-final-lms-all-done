// src/components/AssessmentForm.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAssessment, updateAssessment } from '../services/dataApi';
import './AssessmentForm.css';

const AssessmentForm = ({ assessment, courseId, onSave, onCancel }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: assessment?.title || '',
        description: assessment?.description || '',
        startDate: assessment?.startDate ? new Date(assessment.startDate).toISOString().slice(0, 16) : '',
        endDate: assessment?.endDate ? new Date(assessment.endDate).toISOString().slice(0, 16) : '',
        courseId: courseId
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                ...formData,
                courseId: parseInt(courseId)
            };

            const response = assessment
                ? await updateAssessment(assessment.id, payload)
                : await createAssessment(payload);

            if (response.status === 200 || response.status === 201) {
                await onSave();
                // Navigate to the assessment editor page
                navigate(`/educator/assessments/${response.data.id}/questions`);
            }
        } catch (err) {
            console.error('Error saving assessment:', err);
            setError(err.response?.data?.message || 'Failed to save assessment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="assessment-form-overlay">
            <div className="assessment-form-container">
                <h2>{assessment ? 'Edit Assessment' : 'Create New Assessment'}</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Title</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="Enter assessment title"
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
                            placeholder="Enter assessment description"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="startDate">Start Date</label>
                        <input
                            type="datetime-local"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="endDate">End Date</label>
                        <input
                            type="datetime-local"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            required
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
                            {loading ? 'Saving...' : (assessment ? 'Update Assessment' : 'Create Assessment')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssessmentForm;