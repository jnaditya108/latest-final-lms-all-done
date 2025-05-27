import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { getAssessmentById, getAssessmentQuestions, submitAssessment } from '../services/dataApi';
import './StudentAssessment.css';

function StudentAssessment() {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const userId = localStorage.getItem('userId');

    useEffect(() => {
        const fetchAssessmentData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch assessment details
                const assessmentResponse = await getAssessmentById(assessmentId);
                setAssessment(assessmentResponse.data);

                // Fetch questions
                const questionsResponse = await getAssessmentQuestions(assessmentId);
                setQuestions(questionsResponse.data);

                // Initialize answers object
                const initialAnswers = {};
                questionsResponse.data.forEach(question => {
                    initialAnswers[question.id] = question.questionType === 'MultipleChoice' ? [] : '';
                });
                setAnswers(initialAnswers);
            } catch (err) {
                console.error('Error fetching assessment data:', err);
                const errorMessage = err.response?.data?.message || 'Failed to load assessment. Please try again.';
                setError(errorMessage);
                if (err.response?.status === 401) {
                    localStorage.clear();
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        if (assessmentId) {
            fetchAssessmentData();
        }
    }, [assessmentId, navigate]);

    const handleAnswerChange = (questionId, value, questionType) => {
        if (questionType === 'MultipleChoice') {
            setAnswers(prev => ({
                ...prev,
                [questionId]: Array.isArray(value) ? value : [value]
            }));
        } else {
            setAnswers(prev => ({
                ...prev,
                [questionId]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Validate that all questions are answered
            const unansweredQuestions = questions.filter(question => {
                const answer = answers[question.id];
                if (question.questionType === 'MultipleChoice') {
                    return !answer || answer.length === 0;
                }
                return !answer || answer.trim() === '';
            });

            if (unansweredQuestions.length > 0) {
                setError('Please answer all questions before submitting.');
                setSubmitting(false);
                return;
            }

            // Format answers to match backend expectations
            const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
                questionId: parseInt(questionId),
                answerText: Array.isArray(answer) ? answer.join(',') : answer
            }));

            await submitAssessment(assessmentId, formattedAnswers);
            navigate('/student');
        } catch (err) {
            console.error('Error submitting assessment:', err);
            const errorMessage = err.response?.data?.message || 'Failed to submit assessment. Please try again.';
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="assessment-container">
                    <div className="loading-spinner">Loading assessment...</div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <div className="assessment-container">
                    <div className="error-message">{error}</div>
                    <button onClick={() => navigate('/student')} className="back-button">
                        Back to Dashboard
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="assessment-container">
                <h2>{assessment?.title}</h2>
                <p className="assessment-description">{assessment?.description}</p>

                <form onSubmit={handleSubmit} className="assessment-form">
                    {questions.map((question, index) => (
                        <div key={question.id} className="question-card">
                            <h3>Question {index + 1}</h3>
                            <p className="question-text">{question.text}</p>

                            {question.questionType === 'MultipleChoice' && question.options && (
                                <div className="options-container">
                                    {question.options.map(option => (
                                        <label key={option.id} className="option-label">
                                            <input
                                                type="checkbox"
                                                checked={answers[question.id]?.includes(option.id.toString())}
                                                onChange={(e) => {
                                                    const currentAnswers = answers[question.id] || [];
                                                    const optionId = option.id.toString();
                                                    if (e.target.checked) {
                                                        handleAnswerChange(question.id, [...currentAnswers, optionId], 'MultipleChoice');
                                                    } else {
                                                        handleAnswerChange(
                                                            question.id,
                                                            currentAnswers.filter(id => id !== optionId),
                                                            'MultipleChoice'
                                                        );
                                                    }
                                                }}
                                            />
                                            {option.text}
                                        </label>
                                    ))}
                                </div>
                            )}

                            {question.questionType === 'TrueFalse' && (
                                <div className="true-false-container">
                                    <label className="option-label">
                                        <input
                                            type="radio"
                                            value="true"
                                            checked={answers[question.id] === 'true'}
                                            onChange={(e) => handleAnswerChange(question.id, e.target.value, 'TrueFalse')}
                                        />
                                        True
                                    </label>
                                    <label className="option-label">
                                        <input
                                            type="radio"
                                            value="false"
                                            checked={answers[question.id] === 'false'}
                                            onChange={(e) => handleAnswerChange(question.id, e.target.value, 'TrueFalse')}
                                        />
                                        False
                                    </label>
                                </div>
                            )}

                            {question.questionType === 'ShortAnswer' && (
                                <textarea
                                    value={answers[question.id] || ''}
                                    onChange={(e) => handleAnswerChange(question.id, e.target.value, 'ShortAnswer')}
                                    placeholder="Type your answer here..."
                                    className="short-answer-input"
                                    rows={4}
                                />
                            )}
                        </div>
                    ))}

                    <div className="button-container">
                        <button
                            type="button"
                            onClick={() => navigate('/student')}
                            className="cancel-button"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="submit-button"
                        >
                            {submitting ? 'Submitting...' : 'Submit Assessment'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

export default StudentAssessment; 