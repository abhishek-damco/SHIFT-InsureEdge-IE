using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsureEdge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ResetUserSequence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Fix the user table sequence - it was out of sync causing duplicate key errors
            // when trying to create new users (e.g., linked producer accounts)
            migrationBuilder.Sql(
                @"SELECT setval('""user_id_seq""', (SELECT MAX(id) FROM ""user"") + 1);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No rollback needed - sequence reset is idempotent
        }
    }
}
