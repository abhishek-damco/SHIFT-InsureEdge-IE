using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace InsureEdge.Infrastructure.Migrations;

public partial class AddCommonAddress : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "common_address",
            columns: table => new
            {
                id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                account_id             = table.Column<long>(type: "bigint", nullable: true),
                is_legal_same_as_mailing = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                address_type           = table.Column<string>(type: "character varying(50)",  maxLength: 50,  nullable: true),
                address_line1          = table.Column<string>(type: "text",                                   nullable: true),
                address_line2          = table.Column<string>(type: "text",                                   nullable: true),
                country                = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                state                  = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                city                   = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                zip_code               = table.Column<string>(type: "character varying(20)",  maxLength: 20,  nullable: true),
                latitude               = table.Column<string>(type: "text",                                   nullable: true),
                longitude              = table.Column<string>(type: "text",                                   nullable: true),
                county                 = table.Column<string>(type: "text",                                   nullable: true),
                is_active              = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                is_manual              = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                google_address         = table.Column<string>(type: "text",                                   nullable: true),
                policy_id              = table.Column<long>(type: "bigint", nullable: true),
                claim_id               = table.Column<long>(type: "bigint", nullable: true),
                claimant_id            = table.Column<long>(type: "bigint", nullable: true),
                adjuster_id            = table.Column<long>(type: "bigint", nullable: true),
                payee_id               = table.Column<long>(type: "bigint", nullable: true),
                banking_detail_id      = table.Column<long>(type: "bigint", nullable: true),
                witness_id             = table.Column<long>(type: "bigint", nullable: true),
                created_by             = table.Column<long>(type: "bigint", nullable: true),
                created_on             = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_by             = table.Column<long>(type: "bigint", nullable: true),
                updated_on             = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_common_address", x => x.id);
                table.ForeignKey(
                    name: "FK_common_address_payee_payee_id",
                    column: x => x.payee_id,
                    principalTable: "payee",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_common_address_bank_detail_banking_detail_id",
                    column: x => x.banking_detail_id,
                    principalTable: "bank_detail",
                    principalColumn: "id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_common_address_claim_claim_id",
                    column: x => x.claim_id,
                    principalTable: "claim",
                    principalColumn: "id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_common_address_policy_policy_id",
                    column: x => x.policy_id,
                    principalTable: "policy",
                    principalColumn: "id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateIndex(
            name: "ix_common_address_payee_id",
            table: "common_address",
            column: "payee_id");

        migrationBuilder.CreateIndex(
            name: "ix_common_address_claim_id",
            table: "common_address",
            column: "claim_id");

        migrationBuilder.CreateIndex(
            name: "ix_common_address_policy_id",
            table: "common_address",
            column: "policy_id");

        migrationBuilder.CreateIndex(
            name: "ix_common_address_banking_detail_id",
            table: "common_address",
            column: "banking_detail_id");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "common_address");
    }
}
