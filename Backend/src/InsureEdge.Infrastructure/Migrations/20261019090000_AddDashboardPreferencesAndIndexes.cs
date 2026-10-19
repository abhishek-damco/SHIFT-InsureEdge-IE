using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace InsureEdge.Infrastructure.Migrations;

[DbContext(typeof(InsureEdgeDbContext))]
[Migration("20261019090000_AddDashboardPreferencesAndIndexes")]
public partial class AddDashboardPreferencesAndIndexes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "dashboard_preference",
            columns: table => new
            {
                id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                client_id = table.Column<long>(type: "bigint", nullable: false),
                user_id = table.Column<long>(type: "bigint", nullable: false),
                configuration_json = table.Column<string>(type: "jsonb", nullable: false),
                updated_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_dashboard_preference", x => x.id);
                table.ForeignKey("fk_dashboard_preference_client_client_id", x => x.client_id, "client", "id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("fk_dashboard_preference_user_user_id", x => x.user_id, "user", "id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex("ix_dashboard_preference_client_id_user_id", "dashboard_preference", new[] { "client_id", "user_id" }, unique: true);
        migrationBuilder.CreateIndex("ix_dashboard_preference_user_id", "dashboard_preference", "user_id");
        migrationBuilder.CreateIndex("ix_policy_dashboard_client_producer", "policy", new[] { "client_id", "producer_id", "policy_type", "policy_status", "expiry_date" });
        migrationBuilder.CreateIndex("ix_policy_dashboard_client_intermediary", "policy", new[] { "client_id", "intermediary_id", "policy_type", "policy_status", "expiry_date" });
        migrationBuilder.CreateIndex("ix_policy_payment_dashboard_due", "policy_payment_transaction", new[] { "client_id", "is_paid", "due_date", "transaction_status" });
        migrationBuilder.CreateIndex("ix_audits_dashboard_activity", "audits", new[] { "client_id", "created_by", "module", "activity_type", "created_date_time" });

        migrationBuilder.Sql(@"
            INSERT INTO screen_permissions
                (group_id, screen_id, client_id, is_view_permission, is_create_permission,
                 is_edit_permission, is_duplicate_permission, is_upload_permission,
                 is_download_permission, is_view_sensitive_info, is_access_sensitive_doc,
                 is_approve_reject)
            SELECT g.id, s.id, g.client_id, true, false, false, false, false, false, false, false, false
            FROM ""group"" g
            JOIN app_screen s ON s.screen_code = 'DASHBOARD'
            WHERE lower(g.group_name) = 'producers'
              AND NOT EXISTS (
                  SELECT 1 FROM screen_permissions sp
                  WHERE sp.group_id = g.id AND sp.screen_id = s.id AND sp.client_id = g.client_id
              );");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex("ix_audits_dashboard_activity", "audits");
        migrationBuilder.DropIndex("ix_policy_payment_dashboard_due", "policy_payment_transaction");
        migrationBuilder.DropIndex("ix_policy_dashboard_client_intermediary", "policy");
        migrationBuilder.DropIndex("ix_policy_dashboard_client_producer", "policy");
        migrationBuilder.DropTable("dashboard_preference");
    }
}
