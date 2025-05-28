// File: EduSyncAPI/Models/CourseDto.cs
using System;
using System.Collections.Generic;

namespace EduSyncAPI.Models
{
    public class CourseDto // This DTO represents the Course information you want to expose
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public int InstructorId { get; set; }
        public string InstructorUsername { get; set; } // To display instructor's name

        public string? VideoUrl { get; set; } // NEW
        public string? ThumbnailUrl { get; set; } // NEW
        public string? ModulePdfUrl { get; set; } // NEW: PDF Module URL
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? EnrollmentDate { get; set; }
        
        // New properties for counts
        public int EnrollmentsCount { get; set; }
        public int AssessmentsCount { get; set; }
        
        // Collections for frontend use
        public ICollection<EnrollmentDto>? Enrollments { get; set; }
        public ICollection<AssessmentDto>? Assessments { get; set; }
    }
}