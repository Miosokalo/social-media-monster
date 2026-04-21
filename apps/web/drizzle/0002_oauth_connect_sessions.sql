CREATE TABLE "oauth_connect_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_entity_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"payload_enc" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "oauth_connect_sessions" ADD CONSTRAINT "oauth_connect_sessions_brand_entity_id_brand_entities_id_fk" FOREIGN KEY ("brand_entity_id") REFERENCES "public"."brand_entities"("id") ON DELETE cascade ON UPDATE no action;
