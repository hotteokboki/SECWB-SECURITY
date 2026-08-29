-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "evaluation_type_enum" AS ENUM ('Mentors', 'Social Enterprise');

-- CreateEnum
CREATE TYPE "mentorship_status" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "status" AS ENUM ('Active', 'Inactive');

-- CreateTable
CREATE TABLE "active_sessions" (
    "session_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID,

    CONSTRAINT "active_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "asset" (
    "asset_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "asset_name" TEXT NOT NULL,
    "asset_amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "asset_pkey" PRIMARY KEY ("asset_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "log_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "bill_of_materials" (
    "bom_id" UUID NOT NULL,
    "record_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "raw_material_name" TEXT NOT NULL,
    "raw_material_price" DECIMAL(12,2) NOT NULL,
    "raw_material_qty" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "bill_of_materials_pkey" PRIMARY KEY ("bom_id","record_id")
);

-- CreateTable
CREATE TABLE "bom" (
    "bom_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "bom_name" TEXT NOT NULL,

    CONSTRAINT "bom_pkey" PRIMARY KEY ("bom_id")
);

-- CreateTable
CREATE TABLE "cash_in_report" (
    "cash_in_report_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "se_id" UUID NOT NULL,
    "report_month" DATE NOT NULL,

    CONSTRAINT "cash_in_report_pkey" PRIMARY KEY ("cash_in_report_id")
);

-- CreateTable
CREATE TABLE "cash_in_transaction" (
    "transaction_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "cash_in_report_id" UUID NOT NULL,
    "transaction_date" DATE NOT NULL,
    "cash_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sales_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "other_revenue_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "asset_id" UUID,
    "liability_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "owners_capital_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "entered_by" TEXT,
    "client_txn_key" TEXT,

    CONSTRAINT "cash_in_transaction_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "cash_out_report" (
    "cash_out_report_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "se_id" UUID NOT NULL,
    "report_month" DATE NOT NULL,

    CONSTRAINT "cash_out_report_pkey" PRIMARY KEY ("cash_out_report_id")
);

-- CreateTable
CREATE TABLE "cash_out_transaction" (
    "transaction_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "cash_out_report_id" UUID NOT NULL,
    "transaction_date" DATE NOT NULL,
    "cash_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "expense_id" UUID,
    "asset_id" UUID,
    "inventory_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "liability_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "owners_withdrawal_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "entered_by" TEXT,
    "client_txn_key" TEXT,

    CONSTRAINT "cash_out_transaction_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "collaboration_tiers" (
    "tier_id" INTEGER NOT NULL,
    "tier_name" TEXT NOT NULL,
    "tier_description" TEXT,

    CONSTRAINT "collaboration_tiers_pkey" PRIMARY KEY ("tier_id")
);

-- CreateTable
CREATE TABLE "coordinator_invites" (
    "invite_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6) DEFAULT (now() + '7 days'::interval),

    CONSTRAINT "coordinator_invites_pkey" PRIMARY KEY ("invite_id")
);

-- CreateTable
CREATE TABLE "documents" (
    "document_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT,
    "link" TEXT,
    "date_uploaded" DATE,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "evaluation_categories" (
    "evaluation_category_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "evaluation_id" UUID NOT NULL,
    "category_name" TEXT NOT NULL,
    "rating" INTEGER,
    "additional_comment" TEXT,

    CONSTRAINT "evaluation_categories_pkey" PRIMARY KEY ("evaluation_category_id")
);

-- CreateTable
CREATE TABLE "evaluation_selected_comments" (
    "selected_comment_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "evaluation_category_id" UUID NOT NULL,
    "comment" TEXT NOT NULL,

    CONSTRAINT "evaluation_selected_comments_pkey" PRIMARY KEY ("selected_comment_id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "evaluation_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "mentor_id" UUID,
    "se_id" UUID,
    "created_at" DATE,
    "isAcknowledge" BOOLEAN DEFAULT false,
    "evaluation_type" "evaluation_type_enum",

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("evaluation_id")
);

-- CreateTable
CREATE TABLE "expense" (
    "expense_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "expense_name" TEXT NOT NULL,
    "expense_amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "expense_pkey" PRIMARY KEY ("expense_id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "feedback_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "mentorship_id" UUID,
    "cmnt_id" UUID,
    "rating" INTEGER,
    "isAckowledgedBySE" BOOLEAN,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("feedback_id")
);

-- CreateTable
CREATE TABLE "inventory_report" (
    "inventory_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "se_id" UUID NOT NULL,
    "month" DATE NOT NULL,
    "item_id" UUID NOT NULL,
    "begin_qty" DECIMAL(12,2),
    "begin_unit_price" DECIMAL(12,2),
    "final_qty" DECIMAL(12,2),
    "final_unit_price" DECIMAL(12,2),

    CONSTRAINT "inventory_report_pkey" PRIMARY KEY ("inventory_id")
);

-- CreateTable
CREATE TABLE "item" (
    "item_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "item_name" TEXT NOT NULL,
    "item_price" DECIMAL(12,2) NOT NULL,
    "item_beginning_inventory" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "item_less_count" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bom_id" UUID,

    CONSTRAINT "item_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "mentees_form_submissions" (
    "serial_number" SERIAL NOT NULL,
    "id" TEXT DEFAULT ('SE-APPLICATION-'::text || lpad((serial_number)::text, 4, '0'::text)),
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "consent" BOOLEAN,
    "team_name" TEXT,
    "enterprise_idea_start" TEXT,
    "involved_people" TEXT,
    "current_phase" TEXT,
    "se_nature" TEXT,
    "team_characteristics" TEXT,
    "critical_areas" TEXT[],
    "action_plans" TEXT,
    "meeting_frequency" TEXT,
    "communication_modes" TEXT[],
    "social_media_link" TEXT,
    "focal_person_contact" TEXT,
    "mentoring_team_members" TEXT,
    "preferred_mentoring_time" TEXT[],
    "mentoring_time_note" TEXT,
    "pitch_deck_url" TEXT,
    "se_abbreviation" TEXT,
    "focal_email" TEXT,
    "focal_phone" TEXT,
    "status" TEXT DEFAULT 'Pending',
    "se_description" TEXT,
    "social_problem" TEXT[],
    "team_challenges" TEXT[],

    CONSTRAINT "mentees_form_submissions_pkey" PRIMARY KEY ("serial_number")
);

-- CreateTable
CREATE TABLE "mentor_evaluation_questions" (
    "category" VARCHAR(255) NOT NULL,
    "question_text" TEXT NOT NULL,
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),

    CONSTRAINT "mentor_evaluation_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_form_application" (
    "serial_number" SERIAL NOT NULL,
    "id" TEXT DEFAULT ('MENTOR-'::text || lpad((serial_number)::text, 4, '0'::text)),
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL,
    "motivation" TEXT NOT NULL,
    "expertise" TEXT NOT NULL,
    "business_areas" TEXT[],
    "preferred_time" TEXT[],
    "communication_mode" TEXT[],
    "status" TEXT DEFAULT 'Pending',
    "submitted_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "contact_no" TEXT,

    CONSTRAINT "mentor_form_application_pkey" PRIMARY KEY ("serial_number")
);

-- CreateTable
CREATE TABLE "mentoring_session" (
    "mentoring_session_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "mentorship_id" UUID NOT NULL,
    "start_time" TIMESTAMP(6) NOT NULL,
    "end_time" TIMESTAMP(6) NOT NULL,
    "zoom_link" TEXT,
    "status" VARCHAR(20) DEFAULT 'No Schedule Yet',
    "mentoring_session_date" DATE NOT NULL,

    CONSTRAINT "mentoring_session_pkey" PRIMARY KEY ("mentoring_session_id")
);

-- CreateTable
CREATE TABLE "mentors" (
    "mentor_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "mentor_firstname" TEXT,
    "mentor_lastname" TEXT,
    "number_SE_assigned" INTEGER DEFAULT 0,
    "email" TEXT,
    "contactnum" TEXT,
    "isactive" BOOLEAN DEFAULT true,
    "status" VARCHAR(20) DEFAULT 'Active',
    "critical_areas" TEXT[],
    "is_available_for_assignment" BOOLEAN DEFAULT true,
    "preferred_mentoring_time" TEXT[],
    "accepted_application_id" TEXT,

    CONSTRAINT "Mentors_pkey" PRIMARY KEY ("mentor_id")
);

-- CreateTable
CREATE TABLE "mentorship_collaboration_requests" (
    "mentorship_collaboration_request_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tier" INTEGER NOT NULL,
    "seeking_collaboration_mentor_name" TEXT NOT NULL,
    "seeking_collaboration_se_name" TEXT NOT NULL,
    "seeking_collaboration_se_abbreviation" TEXT NOT NULL,
    "suggested_collaboration_mentor_name" TEXT NOT NULL,
    "suggested_collaboration_se_name" TEXT NOT NULL,
    "suggested_collaboration_se_abbreviation" TEXT NOT NULL,
    "matched_categories" TEXT[],
    "seeking_collaboration_se_strengths" TEXT[],
    "seeking_collaboration_se_weaknesses" TEXT[],
    "suggested_collaboration_se_strengths" TEXT[],
    "suggested_collaboration_se_weaknesses" TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suggested_collaboration_mentor_id" UUID NOT NULL,
    "collaboration_card_id" TEXT NOT NULL,
    "subtier" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Pending',

    CONSTRAINT "mentorship_collaboration_requests_pkey" PRIMARY KEY ("mentorship_collaboration_request_id")
);

-- CreateTable
CREATE TABLE "mentorship_collaborations" (
    "collaboration_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "seeking_collaboration_mentorship_id" UUID NOT NULL,
    "suggested_collaborator_mentorship_id" UUID NOT NULL,
    "tier_id" INTEGER NOT NULL DEFAULT 1,
    "mentorship_collaboration_request_id" UUID NOT NULL,
    "status" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentorship_collaborations_pkey" PRIMARY KEY ("collaboration_id")
);

-- CreateTable
CREATE TABLE "mentorships" (
    "mentorship_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "mentor_id" UUID,
    "se_id" UUID,
    "status" "mentorship_status" DEFAULT 'Active',
    "start_date" DATE DEFAULT CURRENT_DATE,
    "end_date" DATE,

    CONSTRAINT "Mentorships_pkey" PRIMARY KEY ("mentorship_id")
);

-- CreateTable
CREATE TABLE "monthly_report_guard" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "se_id" UUID NOT NULL,
    "month" DATE NOT NULL,
    "report_type" TEXT NOT NULL,

    CONSTRAINT "monthly_report_guard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "notification_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "receiver_id" UUID,
    "title" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "target_route" TEXT,
    "message" TEXT,
    "is_read" BOOLEAN DEFAULT false,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "password_history" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predefined_comments" (
    "comment_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "category_name" TEXT,
    "rating" INTEGER,
    "comment_text" TEXT,

    CONSTRAINT "predefined_comments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "program_assignment" (
    "program_assignment_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_assignment_pkey" PRIMARY KEY ("program_assignment_id")
);

-- CreateTable
CREATE TABLE "programs" (
    "program_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT,
    "description" TEXT,

    CONSTRAINT "Programs_pkey" PRIMARY KEY ("program_id")
);

-- CreateTable
CREATE TABLE "sdg" (
    "sdg_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT,
    "sdg_number" INTEGER,

    CONSTRAINT "SDG_pkey" PRIMARY KEY ("sdg_id")
);

-- CreateTable
CREATE TABLE "session" (
    "sid" VARCHAR(255) NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "signup_passwords" (
    "id" SERIAL NOT NULL,
    "password" TEXT NOT NULL,
    "valid_from" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signup_passwords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socialenterprises" (
    "se_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "team_name" TEXT,
    "program_id" UUID NOT NULL,
    "nummember" INTEGER,
    "sdg_id" UUID[],
    "abbr" TEXT,
    "created_at" DATE DEFAULT CURRENT_DATE,
    "contactnum" TEXT,
    "isactive" BOOLEAN DEFAULT true,
    "critical_areas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "preferred_mentoring_time" TEXT[],
    "mentoring_time_note" TEXT,
    "accepted_application_id" TEXT,

    CONSTRAINT "SocialEnterprises_pkey" PRIMARY KEY ("se_id")
);

-- CreateTable
CREATE TABLE "telegram_password" (
    "tg_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "password" TEXT,
    "date_created" DATE DEFAULT ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila'::text))::date,
    "time_created" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila'::text),

    CONSTRAINT "telegram_password_pkey" PRIMARY KEY ("tg_id")
);

-- CreateTable
CREATE TABLE "telegrambot" (
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "mentor_id" UUID,
    "rating" INTEGER,
    "comments" TEXT,
    "isAcknowledge" BOOLEAN,
    "se_id" UUID,
    "chatid" BIGINT NOT NULL,

    CONSTRAINT "telegrambot_pkey" PRIMARY KEY ("chatid")
);

-- CreateTable
CREATE TABLE "user_has_roles" (
    "user_id" UUID NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "user_has_roles_pkey" PRIMARY KEY ("user_id","role_name")
);

-- CreateTable
CREATE TABLE "user_login_audit" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "email" TEXT,
    "attempted_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "ip" INET,
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL,
    "twofa_pending" BOOLEAN NOT NULL DEFAULT false,
    "status_code" INTEGER NOT NULL,
    "session_id" TEXT,

    CONSTRAINT "user_login_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "role" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("role")
);

-- CreateTable
CREATE TABLE "user_security_questions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer_hash" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_security_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_twofa" (
    "user_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "secret_base32" TEXT,
    "pending_secret_base32" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_twofa_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "password" TEXT,
    "isactive" BOOLEAN DEFAULT false,
    "roles" TEXT DEFAULT 'Guest User',
    "contactnum" TEXT,
    "password_changed_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "users_backup" (
    "user_id" UUID,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "password" TEXT,
    "isactive" BOOLEAN,
    "roles" TEXT,
    "contactnum" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "asset_asset_name_key" ON "asset"("asset_name");

-- CreateIndex
CREATE INDEX "idx_audit_logs_timestamp" ON "audit_logs"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bom_bom_name_key" ON "bom"("bom_name");

-- CreateIndex
CREATE INDEX "idx_cin_report_se_month" ON "cash_in_report"("se_id", "report_month");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cin_se_month" ON "cash_in_report"("se_id", "report_month");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cin_client_key" ON "cash_in_transaction"("client_txn_key");

-- CreateIndex
CREATE INDEX "idx_cin_tx_asset" ON "cash_in_transaction"("asset_id");

-- CreateIndex
CREATE INDEX "idx_cin_tx_date" ON "cash_in_transaction"("transaction_date");

-- CreateIndex
CREATE INDEX "idx_cin_tx_report_id" ON "cash_in_transaction"("cash_in_report_id");

-- CreateIndex
CREATE INDEX "idx_cout_report_se_month" ON "cash_out_report"("se_id", "report_month");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cout_se_month" ON "cash_out_report"("se_id", "report_month");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cout_client_key" ON "cash_out_transaction"("client_txn_key");

-- CreateIndex
CREATE INDEX "idx_cout_tx_asset" ON "cash_out_transaction"("asset_id");

-- CreateIndex
CREATE INDEX "idx_cout_tx_date" ON "cash_out_transaction"("transaction_date");

-- CreateIndex
CREATE INDEX "idx_cout_tx_expense" ON "cash_out_transaction"("expense_id");

-- CreateIndex
CREATE INDEX "idx_cout_tx_report_id" ON "cash_out_transaction"("cash_out_report_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_expense_name_key" ON "expense"("expense_name");

-- CreateIndex
CREATE INDEX "idx_inventory_report_item" ON "inventory_report"("item_id");

-- CreateIndex
CREATE INDEX "idx_inventory_report_se_month" ON "inventory_report"("se_id", "month");

-- CreateIndex
CREATE UNIQUE INDEX "uq_inventory_per_item_per_month" ON "inventory_report"("se_id", "month", "item_id");

-- CreateIndex
CREATE INDEX "idx_item_bom_id" ON "item"("bom_id");

-- CreateIndex
CREATE UNIQUE INDEX "mentees_form_submissions_id_key" ON "mentees_form_submissions"("id");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_form_application_id_key" ON "mentor_form_application"("id");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_form_application_email_key" ON "mentor_form_application"("email");

-- CreateIndex
CREATE INDEX "mentor_form_application_status_idx" ON "mentor_form_application"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mentors_unique_application" ON "mentors"("accepted_application_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_directional_pair_per_tier" ON "mentorship_collaborations"("seeking_collaboration_mentorship_id", "suggested_collaborator_mentorship_id", "tier_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_mrg_se_month_type" ON "monthly_report_guard"("se_id", "month", "report_type");

-- CreateIndex
CREATE INDEX "idx_password_history_user" ON "password_history"("user_id", "changed_at" DESC);

-- CreateIndex
CREATE INDEX "idx_program_assignment_user" ON "program_assignment"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_program" ON "program_assignment"("user_id", "program_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_has_roles_unique" ON "user_has_roles"("user_id", "role_name");

-- CreateIndex
CREATE INDEX "idx_login_audit_user_success_time" ON "user_login_audit"("user_id", "attempted_at" DESC) WHERE (success = true);

-- CreateIndex
CREATE INDEX "idx_login_audit_user_time" ON "user_login_audit"("user_id", "attempted_at" DESC);

-- CreateIndex
CREATE INDEX "idx_user_secq_user" ON "user_security_questions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_security_questions_user_id_position_key" ON "user_security_questions"("user_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "active_sessions" ADD CONSTRAINT "active_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bill_of_materials" ADD CONSTRAINT "fk_bom_in_bomlines" FOREIGN KEY ("bom_id") REFERENCES "bom"("bom_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_in_report" ADD CONSTRAINT "fk_se_cash_in_rep" FOREIGN KEY ("se_id") REFERENCES "socialenterprises"("se_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_in_transaction" ADD CONSTRAINT "fk_asset_in_cin" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_in_transaction" ADD CONSTRAINT "fk_cash_in_report" FOREIGN KEY ("cash_in_report_id") REFERENCES "cash_in_report"("cash_in_report_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_out_report" ADD CONSTRAINT "fk_se_cash_out_rep" FOREIGN KEY ("se_id") REFERENCES "socialenterprises"("se_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_out_transaction" ADD CONSTRAINT "fk_asset_in_cout" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_out_transaction" ADD CONSTRAINT "fk_cash_out_report" FOREIGN KEY ("cash_out_report_id") REFERENCES "cash_out_report"("cash_out_report_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cash_out_transaction" ADD CONSTRAINT "fk_expense_in_cout" FOREIGN KEY ("expense_id") REFERENCES "expense"("expense_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evaluation_categories" ADD CONSTRAINT "evaluation_categories_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("evaluation_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evaluation_selected_comments" ADD CONSTRAINT "evaluation_selected_comments_evaluation_category_id_fkey" FOREIGN KEY ("evaluation_category_id") REFERENCES "evaluation_categories"("evaluation_category_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "mentor_id" FOREIGN KEY ("mentor_id") REFERENCES "mentors"("mentor_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "se_id" FOREIGN KEY ("se_id") REFERENCES "socialenterprises"("se_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "mentorship_ID" FOREIGN KEY ("mentorship_id") REFERENCES "mentorships"("mentorship_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_report" ADD CONSTRAINT "fk_item_inv_rep" FOREIGN KEY ("item_id") REFERENCES "item"("item_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_report" ADD CONSTRAINT "fk_se_inv_rep" FOREIGN KEY ("se_id") REFERENCES "socialenterprises"("se_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "fk_bom_in_item" FOREIGN KEY ("bom_id") REFERENCES "bom"("bom_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mentoring_session" ADD CONSTRAINT "fk_mentorship" FOREIGN KEY ("mentorship_id") REFERENCES "mentorships"("mentorship_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mentors" ADD CONSTRAINT "fk_accepted_application" FOREIGN KEY ("accepted_application_id") REFERENCES "mentor_form_application"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mentors" ADD CONSTRAINT "mentor_id" FOREIGN KEY ("mentor_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mentorship_collaboration_requests" ADD CONSTRAINT "fk_collaboration_tier" FOREIGN KEY ("tier") REFERENCES "collaboration_tiers"("tier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_collaboration_requests" ADD CONSTRAINT "fk_suggested_mentor" FOREIGN KEY ("suggested_collaboration_mentor_id") REFERENCES "mentors"("mentor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_collaborations" ADD CONSTRAINT "fk_collaboration_request" FOREIGN KEY ("mentorship_collaboration_request_id") REFERENCES "mentorship_collaboration_requests"("mentorship_collaboration_request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_collaborations" ADD CONSTRAINT "fk_seeking_collab_mentorship" FOREIGN KEY ("seeking_collaboration_mentorship_id") REFERENCES "mentorships"("mentorship_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_collaborations" ADD CONSTRAINT "fk_suggested_collab_mentorship" FOREIGN KEY ("suggested_collaborator_mentorship_id") REFERENCES "mentorships"("mentorship_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_collaborations" ADD CONSTRAINT "fk_tier" FOREIGN KEY ("tier_id") REFERENCES "collaboration_tiers"("tier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_mentor_fkey" FOREIGN KEY ("mentor_id") REFERENCES "mentors"("mentor_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_se_fkey" FOREIGN KEY ("se_id") REFERENCES "socialenterprises"("se_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "user_id" FOREIGN KEY ("receiver_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "program_assignment" ADD CONSTRAINT "fk_program" FOREIGN KEY ("program_id") REFERENCES "programs"("program_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "program_assignment" ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "socialenterprises" ADD CONSTRAINT "fk_accepted_application" FOREIGN KEY ("accepted_application_id") REFERENCES "mentees_form_submissions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "socialenterprises" ADD CONSTRAINT "program_ID" FOREIGN KEY ("program_id") REFERENCES "programs"("program_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "telegrambot" ADD CONSTRAINT "mentor_ID" FOREIGN KEY ("mentor_id") REFERENCES "mentors"("mentor_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "telegrambot" ADD CONSTRAINT "se_ID" FOREIGN KEY ("se_id") REFERENCES "socialenterprises"("se_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_has_roles" ADD CONSTRAINT "fk_role_name" FOREIGN KEY ("role_name") REFERENCES "user_roles"("role") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_has_roles" ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_login_audit" ADD CONSTRAINT "user_login_audit_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "role" FOREIGN KEY ("role") REFERENCES "user_roles"("role") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_security_questions" ADD CONSTRAINT "user_security_questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_twofa" ADD CONSTRAINT "user_twofa_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "roles" FOREIGN KEY ("roles") REFERENCES "user_roles"("role") ON DELETE NO ACTION ON UPDATE NO ACTION;

