var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddHttpClient();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapGet("/sync", async (IHttpClientFactory httpClientFactory, IConfiguration configuration) =>
{
    var client = httpClientFactory.CreateClient();
    var request = new HttpRequestMessage(HttpMethod.Get, "https://localhost:5001/api/motasticadapter/sync");
    
    var authHeader = configuration["AUTHORIZATION"] ?? "ServiceAccount TW90YXN0aWNBZGFwdGVyOk1vdGFzdGljQWRhcHRlcg==";
    request.Headers.Add("Authorization", authHeader);

    var response = await client.SendAsync(request);
    
    if (response.IsSuccessStatusCode)
    {
        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json");
    }

    return Results.StatusCode((int)response.StatusCode);
})
.WithName("SyncAdapter");

app.Run();
