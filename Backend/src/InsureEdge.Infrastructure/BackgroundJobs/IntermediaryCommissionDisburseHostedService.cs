// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Hosted-service equivalent of OutSystems IntermediaryCommissionDisburseCloud's "last day
// of the month" wake timer. Mirrors AutoRenewalHostedService's structure.
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace InsureEdge.Infrastructure.BackgroundJobs
{
    public class IntermediaryCommissionDisburseHostedService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<IntermediaryCommissionDisburseHostedService> _logger;
        private Timer? _timer;

        // Runs at 3 AM UTC on the last day of each calendar month.
        private readonly int _scheduleHour = 3;

        public IntermediaryCommissionDisburseHostedService(
            IServiceProvider serviceProvider, ILogger<IntermediaryCommissionDisburseHostedService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("IntermediaryCommissionDisburseHostedService starting");

            var delay = CalculateDelayUntilNextRun();
            _logger.LogInformation("Next IntermediaryCommissionDisburse execution in {Hours:F2} hours", delay.TotalHours);

            _timer = new Timer(
                callback: async _ => await ExecuteJobAsync(stoppingToken),
                state: null,
                dueTime: delay,
                period: TimeSpan.FromDays(1)); // re-checked daily; job itself only acts on the last day.

            await Task.Delay(Timeout.Infinite, stoppingToken);
        }

        private async Task ExecuteJobAsync(CancellationToken stoppingToken)
        {
            var today = DateTime.UtcNow;
            if (today.Day != DateTime.DaysInMonth(today.Year, today.Month))
            {
                _logger.LogInformation("IntermediaryCommissionDisburse: not the last day of the month, skipping");
                return;
            }

            try
            {
                _logger.LogInformation("IntermediaryCommissionDisburseTimerJob execution triggered");
                using var scope = _serviceProvider.CreateScope();
                var timerJob = scope.ServiceProvider.GetRequiredService<IntermediaryCommissionDisburseTimerJob>();
                await timerJob.ExecuteAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "IntermediaryCommissionDisburseTimerJob execution failed");
            }
        }

        private TimeSpan CalculateDelayUntilNextRun()
        {
            var now = DateTime.UtcNow;
            var scheduledTime = now.Date.AddHours(_scheduleHour);
            if (now > scheduledTime) scheduledTime = scheduledTime.AddDays(1);
            return scheduledTime - now;
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("IntermediaryCommissionDisburseHostedService stopping");
            _timer?.Dispose();
            await base.StopAsync(cancellationToken);
        }

        public override void Dispose()
        {
            _timer?.Dispose();
            base.Dispose();
        }
    }
}
