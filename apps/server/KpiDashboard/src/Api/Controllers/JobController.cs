using Hangfire;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
    public class JobController : ControllerBase
    {
        [HttpPost]
        [Route("CreateBackgroundJob")]
        public ActionResult CreateBackgroundJob()
        {
            BackgroundJob.Enqueue(() => Console.WriteLine("Background job is triggered"));
            return Ok();
        }
    }