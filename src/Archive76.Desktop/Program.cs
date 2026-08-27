using System.Reflection;
using Archive76.Application.Composition;
using Archive76.Application.Persistence;
using Avalonia;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Archive76.Desktop;

internal static class Program
{
    [STAThread]
    public static void Main(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json", optional: true)
            .Build();

        var services = new ServiceCollection();

        services.AddSingleton<IConfiguration>(configuration);

        services.AddLogging(builder =>
        {
            builder.ClearProviders();
            builder.AddConsole();
            builder.SetMinimumLevel(LogLevel.Information);
        });

        var moduleAssembly = Assembly.Load("Archive76.Infrastructure");
        var moduleTypes = moduleAssembly.GetTypes()
            .Where(t => typeof(IServiceModule).IsAssignableFrom(t) && !t.IsInterface && !t.IsAbstract);

        foreach (var type in moduleTypes)
        {
            var module = (IServiceModule)Activator.CreateInstance(type)!;
            module.ConfigureServices(services, configuration);
        }

        var provider = services.BuildServiceProvider();

        using (var scope = provider.CreateScope())
        {
            var initializer = scope.ServiceProvider.GetRequiredService<IDatabaseInitializer>();
            initializer.EnsureInitializedAsync().GetAwaiter().GetResult();
        }

        BuildAvaloniaApp()
            .StartWithClassicDesktopLifetime(args);
    }

    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<App>()
            .UsePlatformDetect()
            .LogToTrace();
}
