using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Adwais.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameLitiumRateLimitToFetchInterval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "litium_rate_limit",
                table: "global_config",
                newName: "litium_fetch_interval_minutes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "litium_fetch_interval_minutes",
                table: "global_config",
                newName: "litium_rate_limit");
        }
    }
}


