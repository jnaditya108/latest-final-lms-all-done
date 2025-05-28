using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduSyncAPI.Models;
using System.Threading.Tasks;
using System.Collections.Generic;
using EduSyncAPI.Data;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Linq;

namespace EduSyncAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EnrollmentsController : ControllerBase
    {
        private readonly EduSyncContext _context;

        public EnrollmentsController(EduSyncContext context)
        {
            _context = context;
        }

        // 1. Enroll a student into a course
        [HttpPost("enroll")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> EnrollStudent([FromBody] Enrollment enrollment)
        {
            try
            {
                // Check if already enrolled
                var exists = await _context.Enrollments.FirstOrDefaultAsync(e =>
                    e.UserId == enrollment.UserId && e.CourseId == enrollment.CourseId);
                if (exists != null)
                    return BadRequest(new { message = "Student already enrolled in this course." });

                // Verify the course exists
                var course = await _context.Courses.FindAsync(enrollment.CourseId);
                if (course == null)
                    return NotFound(new { message = "Course not found." });

                // Verify the user is a student
                var user = await _context.Users.FindAsync(enrollment.UserId);
                if (user == null || user.Role != "Student")
                    return BadRequest(new { message = "Invalid student ID or user is not a student." });

                enrollment.EnrollmentDate = DateTime.UtcNow;
                _context.Enrollments.Add(enrollment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Student enrolled successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while enrolling the student.", error = ex.Message });
            }
        }

        // 2. Get all students enrolled in a specific course
        [HttpGet("course/{courseId}")]
        [Authorize(Roles = "Educator")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetEnrolledStudents(int courseId)
        {
            try
            {
                var course = await _context.Courses.FindAsync(courseId);
                if (course == null)
                    return NotFound(new { message = "Course not found." });

                var students = await _context.Enrollments
                    .Include(e => e.User)
                    .Where(e => e.CourseId == courseId && e.User.Role == "Student")
                    .Select(e => new UserDto
                    {
                        Id = e.User.Id,
                        Username = e.User.Username,
                        Email = e.User.Email,
                        Role = e.User.Role,
                        EnrollmentDate = e.EnrollmentDate
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Message = "Students retrieved successfully",
                    TotalStudents = students.Count,
                    Students = students
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving enrolled students.", error = ex.Message });
            }
        }

        // 3. Get all courses a student is enrolled in
        [HttpGet("student/{userId}")]
        [Authorize(Roles = "Student")]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetEnrolledCourses(int userId)
        {
            try
            {
                // Verify the user exists and is a student
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found." });
                if (user.Role != "Student")
                    return BadRequest(new { message = "User is not a student." });

                // Get enrolled courses with instructor details
                var courses = await _context.Enrollments
                    .Include(e => e.Course)
                        .ThenInclude(c => c.Instructor)
                    .Where(e => e.UserId == userId)
                    .Select(e => new CourseDto
                    {
                        Id = e.Course.Id,
                        Title = e.Course.Title,
                        Description = e.Course.Description,
                        InstructorId = e.Course.InstructorId,
                        InstructorUsername = e.Course.Instructor.Username,
                        VideoUrl = e.Course.VideoUrl,
                        ThumbnailUrl = e.Course.ThumbnailUrl,
                        EnrollmentDate = e.EnrollmentDate
                    })
                    .ToListAsync();

                return Ok(courses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving enrolled courses.", error = ex.Message });
            }
        }

        // 4. Withdraw a student from a course
        [HttpDelete("withdraw")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> WithdrawStudent([FromBody] Enrollment enrollment)
        {
            try
            {
                var enrollmentRecord = await _context.Enrollments.FirstOrDefaultAsync(e =>
                    e.UserId == enrollment.UserId && e.CourseId == enrollment.CourseId);
                if (enrollmentRecord == null)
                    return NotFound(new { message = "Enrollment not found." });

                _context.Enrollments.Remove(enrollmentRecord);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Student withdrawn successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while withdrawing the student.", error = ex.Message });
            }
        }

        [HttpPut("complete/{enrollmentId}")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> CompleteCourse(int enrollmentId)
        {
            try
            {
                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user ID. Please log in again." });
                }

                var enrollment = await _context.Enrollments
                    .FirstOrDefaultAsync(e => e.Id == enrollmentId && e.UserId == userId);

                if (enrollment == null)
                {
                    return NotFound(new { message = "Enrollment not found or you don't have permission to modify it." });
                }

                enrollment.IsCompleted = !enrollment.IsCompleted; // Toggle completion status
                enrollment.CompletionDate = enrollment.IsCompleted ? DateTime.UtcNow : null;

                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = enrollment.IsCompleted ? "Course marked as completed!" : "Course marked as incomplete.",
                    isCompleted = enrollment.IsCompleted,
                    completionDate = enrollment.CompletionDate
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating course completion status.", error = ex.Message });
            }
        }
    }
}