using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Adwais.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLastSyncErrorToGlobalConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "last_sync_error",
                table: "global_config",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "last_sync_error",
                table: "global_config");
        }
    }
}


