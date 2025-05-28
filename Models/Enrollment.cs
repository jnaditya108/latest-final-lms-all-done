using System;

namespace EduSyncAPI.Models
{
	public class Enrollment
	{
		public int Id { get; set; }
		public int UserId { get; set; }  // Student
		public int CourseId { get; set; }
		public DateTime EnrollmentDate { get; set; } = DateTime.UtcNow;
		public bool IsCompleted { get; set; }
		public DateTime? CompletionDate { get; set; }

		// Navigation properties (optional)
		public User? User { get; set; }
		public Course? Course { get; set; }
	}
}
