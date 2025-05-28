// EduSyncAPI/Models/Course.cs

using System;
using System.Collections.Generic; // Required for ICollection
using System.ComponentModel.DataAnnotations; // For [Required], [MaxLength]
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace EduSyncAPI.Models
{
    public class Course
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Title is required.")]
        [MaxLength(100, ErrorMessage = "Title cannot exceed 100 characters.")]
        public string Title { get; set; }

        [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
        public string Description { get; set; }

        public int InstructorId { get; set; }

        [JsonIgnore]
        [ValidateNever] // This tells model validation to ignore this property
        public User Instructor { get; set; }

        // NEW: Video URL (nullable)
        [MaxLength(1024, ErrorMessage = "Video URL cannot exceed 1024 characters.")]
        public string? VideoUrl { get; set; }

        // NEW: Thumbnail URL (nullable)
        [MaxLength(1024, ErrorMessage = "Thumbnail URL cannot exceed 1024 characters.")]
        public string? ThumbnailUrl { get; set; }

        // NEW: PDF Module URL (nullable)
        [MaxLength(1024, ErrorMessage = "PDF URL cannot exceed 1024 characters.")]
        public string? ModulePdfUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property for assessments in this course
        public ICollection<Assessment> Assessments { get; set; } = new List<Assessment>();

        // Navigation property for enrollments in this course
        // Based on your previous code, this should link to the 'Enrollment' model
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    }
}