using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace InsureEdge.Infrastructure.BackgroundJobs
{
    /// <summary>
    /// Hosted service that runs the AutoRenewalTimerJob on a schedule.
    /// This is the .NET Core equivalent to OutSystems BPT Timer.
    ///
    /// Runs daily at 2:00 AM UTC to create renewal quotes for eligible policies.
    /// </summary>
    public class AutoRenewalHostedService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AutoRenewalHostedService> _logger;
        private Timer? _timer;

        // Configuration: Job runs daily at this time (UTC)
        private readonly int _scheduleHour = 2;     // 2 AM UTC
        private readonly int _scheduleMinute = 0;   // :00

        public AutoRenewalHostedService(IServiceProvider serviceProvider, ILogger<AutoRenewalHostedService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        /// <summary>
        /// Start the background service and schedule the timer job
        /// </summary>
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 AutoRenewalHostedService starting");

            // Calculate delay until next scheduled run
            var delay = CalculateDelayUntilNextRun();
            _logger.LogInformation($"Next AutoRenewal timer execution in {delay.TotalHours:F2} hours");

            // Create timer that runs at scheduled time every day
            _timer = new Timer(
                callback: async _ => await ExecuteJobAsync(stoppingToken),
                state: null,
                dueTime: delay,
                period: TimeSpan.FromDays(1) // Run every 24 hours after first execution
            );

            // Keep the service running until cancellation is requested
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }

        /// <summary>
        /// Execute the renewal quote creation job
        /// </summary>
        private async Task ExecuteJobAsync(CancellationToken stoppingToken)
        {
            try
            {
                _logger.LogInformation("⏰ AutoRenewalTimerJob execution triggered");

                // Create a scope for the job
                using var scope = _serviceProvider.CreateScope();
                var timerJob = scope.ServiceProvider.GetRequiredService<AutoRenewalTimerJob>();

                // Run the job
                await timerJob.ExecuteAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ AutoRenewalTimerJob execution failed");
            }
        }

        /// <summary>
        /// Calculate TimeSpan until next scheduled run (configured time today or tomorrow)
        /// </summary>
        private TimeSpan CalculateDelayUntilNextRun()
        {
            var now = DateTime.UtcNow;
            var scheduledTime = now.Date.AddHours(_scheduleHour).AddMinutes(_scheduleMinute);

            // If scheduled time has already passed today, schedule for tomorrow
            if (now > scheduledTime)
            {
                scheduledTime = scheduledTime.AddDays(1);
            }

            return scheduledTime - now;
        }

        /// <summary>
        /// Cleanup when service is stopping
        /// </summary>
        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("🛑 AutoRenewalHostedService stopping");
            _timer?.Dispose();
            await base.StopAsync(cancellationToken);
        }

        /// <summary>
        /// Dispose resources
        /// </summary>
        public override void Dispose()
        {
            _timer?.Dispose();
            base.Dispose();
        }
    }
}
