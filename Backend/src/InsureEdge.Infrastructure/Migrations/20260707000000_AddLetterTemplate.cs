using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace InsureEdge.Infrastructure.Migrations;

public partial class AddLetterTemplate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "letter_template",
            columns: table => new
            {
                id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                client_id = table.Column<long>(type: "bigint", nullable: false),
                template_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                current_version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                template_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                template_category = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                insurance_type = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                line_of_business = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                subject_line = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                description = table.Column<string>(type: "text", nullable: true),
                created_by = table.Column<long>(type: "bigint", nullable: true),
                created_on = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                updated_by = table.Column<long>(type: "bigint", nullable: true),
                updated_on = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_letter_template", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "letter_template_document",
            columns: table => new
            {
                id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                template_id = table.Column<long>(type: "bigint", nullable: false),
                document_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                document_file = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                effective_start_date = table.Column<DateOnly>(type: "date", nullable: true),
                effective_end_date = table.Column<DateOnly>(type: "date", nullable: true),
                created_by = table.Column<long>(type: "bigint", nullable: true),
                created_on = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                updated_by = table.Column<long>(type: "bigint", nullable: true),
                updated_on = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_letter_template_document", x => x.id);
                table.ForeignKey(
                    name: "FK_letter_template_document_letter_template_template_id",
                    column: x => x.template_id,
                    principalTable: "letter_template",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "letter_template_state",
            columns: table => new
            {
                id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                template_id = table.Column<long>(type: "bigint", nullable: false),
                state = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_letter_template_state", x => x.id);
                table.ForeignKey(
                    name: "FK_letter_template_state_letter_template_template_id",
                    column: x => x.template_id,
                    principalTable: "letter_template",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "ix_letter_template_client_id",
            table: "letter_template",
            column: "client_id");

        migrationBuilder.CreateIndex(
            name: "ix_letter_template_document_template_id",
            table: "letter_template_document",
            column: "template_id");

        migrationBuilder.CreateIndex(
            name: "ix_letter_template_state_template_id",
            table: "letter_template_state",
            column: "template_id");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "letter_template_document");
        migrationBuilder.DropTable(name: "letter_template_state");
        migrationBuilder.DropTable(name: "letter_template");
    }
}
