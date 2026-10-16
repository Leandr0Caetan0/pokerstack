var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();
app.UseCors();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok", app = "Poker Stack API" }));
app.MapPost("/api/calculate", (CalculationRequest request) =>
{
    if (request.Kits is < 1 or > 10) return Results.BadRequest(new { error = "Kits deve estar entre 1 e 10." });
    if (request.Players is < 2 or > 39) return Results.BadRequest(new { error = "Jogadores deve estar entre 2 e 39." });
    if (request.Rebuys is < 1 or > 3) return Results.BadRequest(new { error = "Rebuys deve estar entre 1 e 3." });

    var stacks = request.Players + request.Rebuys;
    var chipsPerDenomination = (request.Kits * 40) / stacks;
    var leftoverPerDenomination = (request.Kits * 40) - (chipsPerDenomination * stacks);
    var denominations = new[] { 1, 5, 10, 25, 50 };
    var perStack = denominations.Select(value => new DenominationResult(value, chipsPerDenomination, chipsPerDenomination * value)).ToArray();
    return Results.Ok(new CalculationResponse(
        request.Kits, request.Kits * 200, request.Players, request.Rebuys, stacks,
        chipsPerDenomination * 91, chipsPerDenomination * 5, perStack, leftoverPerDenomination));
});

// The React production build is copied to wwwroot by the setup instructions.
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");
app.Run();

record CalculationRequest(int Kits, int Players, int Rebuys);
record DenominationResult(int Value, int ChipsPerStack, int TotalValuePerStack);
record CalculationResponse(int Kits, int TotalPhysicalChips, int Players, int Rebuys, int TotalStacks,
    int StackValue, int PhysicalChipsPerStack, DenominationResult[] Denominations, int LeftoverPerDenomination);
