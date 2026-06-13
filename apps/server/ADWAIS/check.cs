using System;
using Microsoft.EntityFrameworkCore;
using Adwais.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;

// We will just read the connection string from appsettings.Development.json
var builder = new DbContextOptionsBuilder<AnalyticsDbContext>();
builder.UseNpgsql("Host=localhost;Database=motillo;Username=postgres;Password=postgres");
using var db = new AnalyticsDbContext(builder.Options);
var items = db.GlobalConfigs.ToList();
Console.WriteLine("Count: " + items.Count);
foreach(var item in items) {
    Console.WriteLine("ID: " + item.Id);
}
