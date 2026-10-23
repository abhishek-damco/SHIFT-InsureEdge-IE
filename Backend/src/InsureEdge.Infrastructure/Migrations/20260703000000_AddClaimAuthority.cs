using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace InsureEdge.Infrastructure.Migrations;

public partial class AddClaimAuthority : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "claim_authorities",
            columns: table => new
            {
                id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                client_id = table.Column<long>(type: "bigint", nullable: false),
                user_id = table.Column<long>(type: "bigint", nullable: false),
                payment_approval_limit = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 0m),
                reserve_approval_limit = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 0m),
                is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                created_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "NOW()")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_claim_authorities", x => x.id);
                table.ForeignKey(
                    name: "FK_claim_authorities_user_user_id",
                    column: x => x.user_id,
                    principalTable: "user",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "ix_claim_authorities_client_id",
            table: "claim_authorities",
            column: "client_id");

        migrationBuilder.CreateIndex(
            name: "ix_claim_authorities_user_id",
            table: "claim_authorities",
            column: "user_id");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "claim_authorities");
    }
}
