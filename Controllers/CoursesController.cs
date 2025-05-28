using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using EduSyncAPI.Models;
using EduSyncAPI.Data;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Http;
using System.IO;
using Microsoft.AspNetCore.Hosting;
using System;

namespace EduSyncAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CoursesController : ControllerBase
    {
        private readonly EduSyncContext _context;
        private readonly IWebHostEnvironment _env;

        public CoursesController(EduSyncContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        private async Task<string?> SaveFile(IFormFile? file, string folderName)
        {
            if (file == null || file.Length == 0)
            {
                Console.WriteLine($"No {folderName} file provided or file is empty");
                return null;
            }

            try
            {
                Console.WriteLine($"Processing {folderName} file: {file.FileName}, Size: {file.Length} bytes");

                // Define allowed extensions and max size
                var allowedExtensions = new List<string>();
                long maxSize = 50 * 1024 * 1024; // Default 50 MB

                if (folderName == "videos")
                {
                    allowedExtensions = new List<string> { ".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm" };
                    maxSize = 500 * 1024 * 1024; // 500 MB for videos
                }
                else if (folderName == "thumbnails")
                {
                    allowedExtensions = new List<string> { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                    maxSize = 10 * 1024 * 1024; // 10 MB for thumbnails
                }
                else if (folderName == "pdfs")
                {
                    allowedExtensions = new List<string> { ".pdf" };
                    maxSize = 100 * 1024 * 1024; // 100 MB for PDFs
                }

                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                Console.WriteLine($"File extension: {fileExtension}");
                Console.WriteLine($"Allowed extensions: {string.Join(", ", allowedExtensions)}");

                if (!allowedExtensions.Contains(fileExtension))
                {
                    var errorMessage = $"File type '{fileExtension}' is not allowed for {folderName}. Allowed types: {string.Join(", ", allowedExtensions)}";
                    Console.WriteLine(errorMessage);
                    throw new ArgumentException(errorMessage);
                }

                if (file.Length > maxSize)
                {
                    var errorMessage = $"File size exceeds the limit for {folderName}. Max size: {maxSize / (1024 * 1024)} MB";
                    Console.WriteLine(errorMessage);
                    throw new ArgumentException(errorMessage);
                }

                var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", folderName);
                if (!Directory.Exists(uploadsFolder))
                {
                    Console.WriteLine($"Creating directory: {uploadsFolder}");
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = $"{Guid.NewGuid()}_{DateTime.Now.Ticks}{fileExtension}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);
                Console.WriteLine($"Saving file to: {filePath}");

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                var relativePath = $"/uploads/{folderName}/{uniqueFileName}";
                Console.WriteLine($"File saved successfully. Relative path: {relativePath}");
                return relativePath;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving {folderName} file: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        private void DeleteFile(string? filePath)
        {
            if (string.IsNullOrEmpty(filePath)) return;

            var fullPath = Path.Combine(_env.WebRootPath, filePath.TrimStart('/'));
            if (System.IO.File.Exists(fullPath))
            {
                try
                {
                    System.IO.File.Delete(fullPath);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error deleting file {fullPath}: {ex.Message}");
                }
            }
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetCourses()
        {
            try
            {
                var courses = await _context.Courses
                    .Include(c => c.Instructor)
                    .Include(c => c.Enrollments)
                    .Include(c => c.Assessments)
                    .ToListAsync();

                var courseDtos = courses.Select(c => new CourseDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    InstructorId = c.InstructorId,
                    InstructorUsername = c.Instructor?.Username ?? "N/A",
                    VideoUrl = c.VideoUrl,
                    ThumbnailUrl = c.ThumbnailUrl,
                    ModulePdfUrl = c.ModulePdfUrl,
                    CreatedAt = c.CreatedAt,
                    EnrollmentsCount = c.Enrollments != null ? c.Enrollments.Count : 0,
                    AssessmentsCount = c.Assessments != null ? c.Assessments.Count : 0,
                    // Include full collections for frontend use if needed
                    Enrollments = c.Enrollments?.Select(e => new EnrollmentDto
                    {
                        Id = e.Id,
                        UserId = e.UserId,
                        CourseId = e.CourseId,
                        EnrollmentDate = e.EnrollmentDate,
                        IsCompleted = e.IsCompleted
                    }).ToList(),
                    Assessments = c.Assessments?.Select(a => new AssessmentDto
                    {
                        Id = a.Id,
                        Title = a.Title,
                        Description = a.Description,
                        StartDate = a.StartDate,
                        EndDate = a.EndDate,
                        CourseId = a.CourseId
                    }).ToList()
                }).ToList();

                return Ok(courseDtos);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting courses: {ex}");
                return StatusCode(500, new { message = "An error occurred while retrieving courses.", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<CourseDto>> GetCourse(int id)
        {
            var course = await _context.Courses
                .Include(c => c.Instructor)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (course == null)
            {
                return NotFound();
            }

            var courseDto = new CourseDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                InstructorId = course.InstructorId,
                InstructorUsername = course.Instructor?.Username ?? "N/A",
                VideoUrl = course.VideoUrl,
                ThumbnailUrl = course.ThumbnailUrl,
                ModulePdfUrl = course.ModulePdfUrl
            };

            return Ok(courseDto);
        }

        [HttpPost]
        [Authorize(Roles = "Educator")]
        public async Task<ActionResult<CourseDto>> CreateCourse(
            [FromForm] string title, 
            [FromForm] string description, 
            [FromForm] IFormFile? videoFile, 
            [FromForm] IFormFile? thumbnailFile,
            [FromForm] IFormFile? modulePdfFile)
        {
            try
            {
                Console.WriteLine("CreateCourse called");
                Console.WriteLine($"Title: {title}");
                Console.WriteLine($"Description: {description}");
                Console.WriteLine($"Video file: {videoFile?.FileName ?? "none"}");
                Console.WriteLine($"Thumbnail file: {thumbnailFile?.FileName ?? "none"}");
                Console.WriteLine($"PDF file: {modulePdfFile?.FileName ?? "none"}");

                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId");
                if (userIdClaim == null)
                {
                    Console.WriteLine("No userId claim found in token. Available claims: " + string.Join(", ", User.Claims.Select(c => $"{c.Type}: {c.Value}")));
                    return Unauthorized(new { message = "Invalid user ID. Please log in as an educator." });
                }

                if (!int.TryParse(userIdClaim.Value, out int instructorId))
                {
                    Console.WriteLine($"Failed to parse userId claim value: {userIdClaim.Value}");
                    return Unauthorized(new { message = "Invalid user ID format." });
                }

                if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(description))
                {
                    return BadRequest(new { message = "Title and Description cannot be empty." });
                }

                string? videoUrl = null;
                string? thumbnailUrl = null;
                string? modulePdfUrl = null;

                try
                {
                    videoUrl = await SaveFile(videoFile, "videos");
                    thumbnailUrl = await SaveFile(thumbnailFile, "thumbnails");
                    modulePdfUrl = await SaveFile(modulePdfFile, "pdfs");

                    Console.WriteLine($"Files saved - Video: {videoUrl}, Thumbnail: {thumbnailUrl}, PDF: {modulePdfUrl}");
                }
                catch (ArgumentException ex)
                {
                    Console.WriteLine($"File validation error: {ex.Message}");
                    return BadRequest(new { message = ex.Message });
                }

                var course = new Course
                {
                    Title = title,
                    Description = description,
                    InstructorId = instructorId,
                    VideoUrl = videoUrl,
                    ThumbnailUrl = thumbnailUrl,
                    ModulePdfUrl = modulePdfUrl
                };

                _context.Courses.Add(course);
                await _context.SaveChangesAsync();

                await _context.Entry(course).Reference(c => c.Instructor).LoadAsync();

                var courseDto = new CourseDto
                {
                    Id = course.Id,
                    Title = course.Title,
                    Description = course.Description,
                    InstructorId = course.InstructorId,
                    InstructorUsername = course.Instructor?.Username ?? "N/A",
                    VideoUrl = course.VideoUrl,
                    ThumbnailUrl = course.ThumbnailUrl,
                    ModulePdfUrl = course.ModulePdfUrl
                };

                Console.WriteLine($"Course created successfully with ID: {course.Id}");
                return CreatedAtAction(nameof(GetCourse), new { id = course.Id }, courseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating course: {ex}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "An error occurred while creating the course.", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Educator")]
        public async Task<IActionResult> UpdateCourse(
            int id, 
            [FromForm] string title, 
            [FromForm] string description, 
            [FromForm] IFormFile? videoFile, 
            [FromForm] IFormFile? thumbnailFile,
            [FromForm] IFormFile? modulePdfFile)
        {
            try
            {
                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int currentUserId))
                {
                    return Unauthorized(new { message = "Invalid user ID. Please log in as an educator." });
                }

                var course = await _context.Courses.FindAsync(id);
                if (course == null)
                {
                    return NotFound(new { message = $"Course with ID {id} not found." });
                }

                if (course.InstructorId != currentUserId)
                {
                    return Forbid("You are not authorized to update this course.");
                }

                if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(description))
                {
                    return BadRequest(new { message = "Title and Description cannot be empty." });
                }

                try
                {
                    if (videoFile != null)
                    {
                        DeleteFile(course.VideoUrl);
                        course.VideoUrl = await SaveFile(videoFile, "videos");
                    }

                    if (thumbnailFile != null)
                    {
                        DeleteFile(course.ThumbnailUrl);
                        course.ThumbnailUrl = await SaveFile(thumbnailFile, "thumbnails");
                    }

                    if (modulePdfFile != null)
                    {
                        DeleteFile(course.ModulePdfUrl);
                        course.ModulePdfUrl = await SaveFile(modulePdfFile, "pdfs");
                    }

                    course.Title = title;
                    course.Description = description;

                    await _context.SaveChangesAsync();

                    // Return the updated course data
                    var updatedCourseDto = new CourseDto
                    {
                        Id = course.Id,
                        Title = course.Title,
                        Description = course.Description,
                        InstructorId = course.InstructorId,
                        VideoUrl = course.VideoUrl,
                        ThumbnailUrl = course.ThumbnailUrl,
                        ModulePdfUrl = course.ModulePdfUrl
                    };

                    return Ok(updatedCourseDto);
                }
                catch (ArgumentException ex)
                {
                    return BadRequest(new { message = ex.Message });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating course: {ex}");
                return StatusCode(500, new { message = "An error occurred while updating the course.", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Educator")]  // Only educators can delete courses
        public async Task<IActionResult> DeleteCourse(int id)
        {
            try
            {
                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int currentUserId))
                {
                    return Unauthorized(new { message = "Invalid user ID. Please log in as an educator." });
                }

                var course = await _context.Courses
                    .Include(c => c.Enrollments)
                    .Include(c => c.Assessments)
                        .ThenInclude(a => a.Questions)
                            .ThenInclude(q => q.Options)
                    .Include(c => c.Assessments)
                        .ThenInclude(a => a.StudentAnswers)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (course == null)
                {
                    return NotFound(new { message = $"Course with ID {id} not found." });
                }

                // Check if the current user is the course instructor
                if (course.InstructorId != currentUserId)
                {
                    return Forbid("You are not authorized to delete this course.");
                }

                // Delete associated files
                if (!string.IsNullOrEmpty(course.VideoUrl))
                {
                    DeleteFile(course.VideoUrl);
                }
                if (!string.IsNullOrEmpty(course.ThumbnailUrl))
                {
                    DeleteFile(course.ThumbnailUrl);
                }
                if (!string.IsNullOrEmpty(course.ModulePdfUrl))
                {
                    DeleteFile(course.ModulePdfUrl);
                }

                // Remove all enrollments
                if (course.Enrollments != null)
                {
                    _context.Enrollments.RemoveRange(course.Enrollments);
                }

                // Remove all assessment questions, options, student answers, and then assessments
                if (course.Assessments != null)
                {
                    foreach (var assessment in course.Assessments)
                    {
                        // Remove student answers first
                        if (assessment.StudentAnswers != null)
                        {
                            _context.StudentAnswers.RemoveRange(assessment.StudentAnswers);
                        }

                        // Remove questions and their options
                        if (assessment.Questions != null)
                        {
                            foreach (var question in assessment.Questions)
                            {
                                if (question.Options != null)
                                {
                                    _context.Options.RemoveRange(question.Options);
                                }
                                _context.Questions.Remove(question);
                            }
                        }
                    }
                    _context.Assessments.RemoveRange(course.Assessments);
                }

                // Remove the course
                _context.Courses.Remove(course);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Course and all associated data deleted successfully." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting course: {ex}");
                return StatusCode(500, new { message = "An error occurred while deleting the course.", error = ex.Message });
            }
        }

        [HttpGet("{courseId}/students")]
        [Authorize(Roles = "Educator")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetStudentsEnrolledInCourse(int courseId)
        {
            try
            {
                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId");
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int currentUserId))
                {
                    return Unauthorized(new { message = "Invalid user ID. Please log in again." });
                }

                var course = await _context.Courses.FirstOrDefaultAsync(c => c.Id == courseId);
                if (course == null)
                {
                    return NotFound(new { message = $"Course with ID {courseId} not found." });
                }

                if (course.InstructorId != currentUserId)
                {
                    return Forbid("You are not authorized to view students for this course.");
                }

                var enrolledStudents = await _context.Enrollments
                    .Where(e => e.CourseId == courseId)
                    .Include(e => e.User)
                    .Where(e => e.User.Role == "Student")
                    .Select(e => new UserDto
                    {
                        Id = e.User.Id,
                        Username = e.User.Username,
                        Email = e.User.Email,
                        Role = e.User.Role
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Message = "Students retrieved successfully",
                    TotalStudents = enrolledStudents.Count,
                    Students = enrolledStudents
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving students", error = ex.Message });
            }
        }

        private bool CourseExists(int id)
        {
            return _context.Courses.Any(e => e.Id == id);
        }
    }
} 