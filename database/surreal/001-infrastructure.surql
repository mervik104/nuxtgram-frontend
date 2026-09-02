-- Nuxtgram database infrastructure for SurrealDB 3.2.4.
-- Execute this file in namespace main and database main as a database owner.
-- Clerk token lifetime is enforced by Clerk (60 seconds). SurrealDB validates
-- the signature, issuer and audience before resolving the record user.

DEFINE TABLE IF NOT EXISTS users SCHEMAFULL
  PERMISSIONS
    FOR select WHERE true
    FOR create WHERE false
    FOR update WHERE id = $auth.id
    FOR delete WHERE false;

DEFINE TABLE IF NOT EXISTS media SCHEMAFULL
  PERMISSIONS
    FOR select WHERE true
    FOR create WHERE false
    FOR update WHERE false
    FOR delete WHERE false;

DEFINE TABLE IF NOT EXISTS posts SCHEMAFULL
  PERMISSIONS
    FOR select WHERE true
    FOR create WHERE author = $auth.id
    FOR update WHERE author = $auth.id
    FOR delete WHERE author = $auth.id;

DEFINE TABLE IF NOT EXISTS comments SCHEMAFULL
  PERMISSIONS
    FOR select WHERE true
    FOR create WHERE author = $auth.id
    FOR update WHERE author = $auth.id
    FOR delete WHERE author = $auth.id;

DEFINE TABLE OVERWRITE follows SCHEMAFULL TYPE RELATION IN users OUT users ENFORCED
  PERMISSIONS
    FOR select WHERE $auth.id != NONE
    FOR create WHERE in = $auth.id AND in != out
    FOR update WHERE false
    FOR delete WHERE in = $auth.id;

DEFINE TABLE IF NOT EXISTS post_reactions SCHEMAFULL TYPE RELATION IN users OUT posts ENFORCED
  PERMISSIONS
    FOR select WHERE true
    FOR create WHERE in = $auth.id
    FOR update WHERE in = $auth.id
    FOR delete WHERE in = $auth.id;

DEFINE TABLE IF NOT EXISTS comment_reactions SCHEMAFULL TYPE RELATION IN users OUT comments ENFORCED
  PERMISSIONS
    FOR select WHERE true
    FOR create WHERE in = $auth.id
    FOR update WHERE in = $auth.id
    FOR delete WHERE in = $auth.id;

-- clerkId is the Clerk "sub" (public, random subject uuid) and is never rendered
-- by the app. It must NOT carry a field-level PERMISSIONS clause: any permission
-- referencing $auth is treated as opaque by the planner and forces it to evaluate
-- every computed field for every row of every `users` scan (cloud WARN
-- "Field-permission expression has opaque dependencies", surreal/surrealdb#7416).
-- The AUTHENTICATE block below resolves the record via clerkId as a system user,
-- so table/field restrictions do not apply there; email stays guarded by its own
-- per-record permission.
DEFINE FIELD OVERWRITE clerkId ON TABLE users TYPE string READONLY;
DEFINE FIELD IF NOT EXISTS legacyId ON TABLE users TYPE option<string> READONLY
  PERMISSIONS NONE;
DEFINE FIELD IF NOT EXISTS username ON TABLE users TYPE string
  ASSERT string::len($value) >= 3 AND string::len($value) <= 48;
DEFINE FIELD IF NOT EXISTS nickname ON TABLE users TYPE string
  ASSERT string::len($value) >= 3 AND string::len($value) <= 30;
DEFINE FIELD IF NOT EXISTS bio ON TABLE users TYPE option<string>
  ASSERT $value = NONE OR string::len($value) <= 200;
-- email виден только самому владельцу записи. Канонический порядок $auth.id = id
-- (поле-ид справа) — так планировщику проще связать условие с записью.
-- ЗАМЕТКА: SurrealDB 2.x предупреждает «Field-permission expression has opaque
-- dependencies» для field-perm, ссылающихся на $auth (known issue #7416) — это
-- WARN о per-row оценке на маленькой таблице users, НЕ ошибка; игнорируем.
DEFINE FIELD IF NOT EXISTS email ON TABLE users TYPE option<string> READONLY
  PERMISSIONS FOR select WHERE $auth.id = id;
DEFINE FIELD IF NOT EXISTS avatar ON TABLE users TYPE option<record<media>>;
DEFINE FIELD IF NOT EXISTS createdAt ON TABLE users TYPE datetime VALUE time::now() READONLY;
DEFINE FIELD IF NOT EXISTS updatedAt ON TABLE users TYPE datetime VALUE time::now();

DEFINE FIELD IF NOT EXISTS legacyId ON TABLE media TYPE option<string> READONLY
  PERMISSIONS NONE;
DEFINE FIELD IF NOT EXISTS owner ON TABLE media TYPE record<users> READONLY
  PERMISSIONS NONE;
DEFINE FIELD IF NOT EXISTS objectKey ON TABLE media TYPE string READONLY
  PERMISSIONS NONE;
DEFINE FIELD IF NOT EXISTS publicUrl ON TABLE media TYPE string READONLY;
DEFINE FIELD IF NOT EXISTS thumbnailObjectKey ON TABLE media TYPE option<string> READONLY
  PERMISSIONS NONE;
DEFINE FIELD IF NOT EXISTS cardObjectKey ON TABLE media TYPE option<string> READONLY
  PERMISSIONS NONE;
DEFINE FIELD IF NOT EXISTS filename ON TABLE media TYPE string READONLY;
DEFINE FIELD IF NOT EXISTS alt ON TABLE media TYPE string;
DEFINE FIELD IF NOT EXISTS mimeType ON TABLE media TYPE string READONLY;
DEFINE FIELD IF NOT EXISTS size ON TABLE media TYPE number READONLY
  ASSERT $value >= 0;
DEFINE FIELD IF NOT EXISTS width ON TABLE media TYPE option<number> READONLY;
DEFINE FIELD IF NOT EXISTS height ON TABLE media TYPE option<number> READONLY;
DEFINE FIELD IF NOT EXISTS thumbnailWidth ON TABLE media TYPE option<number> READONLY;
DEFINE FIELD IF NOT EXISTS thumbnailHeight ON TABLE media TYPE option<number> READONLY;
DEFINE FIELD IF NOT EXISTS cardWidth ON TABLE media TYPE option<number> READONLY;
DEFINE FIELD IF NOT EXISTS cardHeight ON TABLE media TYPE option<number> READONLY;
DEFINE FIELD IF NOT EXISTS createdAt ON TABLE media TYPE datetime VALUE time::now() READONLY;
DEFINE FIELD IF NOT EXISTS updatedAt ON TABLE media TYPE datetime VALUE time::now();

DEFINE FIELD IF NOT EXISTS legacyId ON TABLE posts TYPE option<string> READONLY
  PERMISSIONS NONE;
DEFINE FIELD IF NOT EXISTS content ON TABLE posts TYPE string
  ASSERT string::len($value) >= 1 AND string::len($value) <= 15000;
DEFINE FIELD IF NOT EXISTS author ON TABLE posts TYPE record<users> READONLY;
DEFINE FIELD IF NOT EXISTS images ON TABLE posts TYPE option<array<record<media>>>;
DEFINE FIELD IF NOT EXISTS createdAt ON TABLE posts TYPE datetime VALUE time::now() READONLY;
DEFINE FIELD IF NOT EXISTS updatedAt ON TABLE posts TYPE datetime VALUE time::now();

DEFINE FIELD IF NOT EXISTS legacyId ON TABLE comments TYPE option<string> READONLY
  PERMISSIONS NONE;
DEFINE FIELD IF NOT EXISTS content ON TABLE comments TYPE string
  ASSERT string::len($value) >= 1 AND string::len($value) <= 5000;
DEFINE FIELD IF NOT EXISTS author ON TABLE comments TYPE record<users> READONLY;
DEFINE FIELD IF NOT EXISTS post ON TABLE comments TYPE record<posts> READONLY;
DEFINE FIELD IF NOT EXISTS images ON TABLE comments TYPE option<array<record<media>>>;
DEFINE FIELD IF NOT EXISTS createdAt ON TABLE comments TYPE datetime VALUE time::now() READONLY;
DEFINE FIELD IF NOT EXISTS updatedAt ON TABLE comments TYPE datetime VALUE time::now();

DEFINE FIELD IF NOT EXISTS type ON TABLE post_reactions TYPE "like" | "love" | "fire" | "haha";
DEFINE FIELD IF NOT EXISTS type ON TABLE comment_reactions TYPE "like" | "love" | "fire" | "haha";

DEFINE INDEX IF NOT EXISTS users_clerk_id ON TABLE users COLUMNS clerkId UNIQUE;
DEFINE INDEX IF NOT EXISTS users_legacy_id ON TABLE users COLUMNS legacyId UNIQUE;
DEFINE INDEX IF NOT EXISTS users_nickname ON TABLE users COLUMNS nickname UNIQUE;
DEFINE INDEX IF NOT EXISTS users_email ON TABLE users COLUMNS email UNIQUE;

DEFINE INDEX IF NOT EXISTS media_legacy_id ON TABLE media COLUMNS legacyId UNIQUE;
DEFINE INDEX IF NOT EXISTS media_object_key ON TABLE media COLUMNS objectKey UNIQUE;
DEFINE INDEX IF NOT EXISTS media_owner ON TABLE media COLUMNS owner;

DEFINE INDEX IF NOT EXISTS posts_legacy_id ON TABLE posts COLUMNS legacyId UNIQUE;
DEFINE INDEX IF NOT EXISTS posts_author_created ON TABLE posts COLUMNS author, createdAt;
DEFINE INDEX IF NOT EXISTS posts_created ON TABLE posts COLUMNS createdAt;

DEFINE INDEX IF NOT EXISTS comments_legacy_id ON TABLE comments COLUMNS legacyId UNIQUE;
DEFINE INDEX IF NOT EXISTS comments_post_created ON TABLE comments COLUMNS post, createdAt;
DEFINE INDEX IF NOT EXISTS comments_created ON TABLE comments COLUMNS createdAt;

DEFINE INDEX IF NOT EXISTS follows_pair ON TABLE follows COLUMNS in, out UNIQUE;
DEFINE INDEX IF NOT EXISTS follows_in ON TABLE follows COLUMNS in;
DEFINE INDEX IF NOT EXISTS follows_out ON TABLE follows COLUMNS out;

DEFINE INDEX IF NOT EXISTS post_reactions_pair ON TABLE post_reactions COLUMNS in, out UNIQUE;
DEFINE INDEX IF NOT EXISTS post_reactions_out ON TABLE post_reactions COLUMNS out;
DEFINE INDEX IF NOT EXISTS comment_reactions_pair ON TABLE comment_reactions COLUMNS in, out UNIQUE;
DEFINE INDEX IF NOT EXISTS comment_reactions_out ON TABLE comment_reactions COLUMNS out;

DEFINE ACCESS OVERWRITE clerk ON DATABASE TYPE RECORD WITH JWT
  ALGORITHM RS256 KEY "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzSyAgLcvV5eg8eEDwvSD\n3Y05X9Cekjv/cokzC7Rc8j2MxSoyHcvSRPfDdZgSwyfbGRaWxBxC/fActDzgUAGD\nrTYzl9rmRLc7GKwywzpEY1Kj830PwNBKIqS2eOEH1Vp8OnYCExhZ4Af15i32pwQh\n4hdURHJL8is6mgO3jH7O7AU5yXKP7z9quTmbmw65ppnKF/0FgmwNtJEe5J2ut9Ta\nR4WD74rExL3+PinChxu/VyB4DtjoVhVqU1TheWTGiIrO4RzbseFCY8oh65EUASYK\nrqusWcU4q2WGADosbk+DA32yZTO59JsnV4+1d7+87FRc/U3g/SKsdxUPINtn0PMl\nJwIDAQAB\n-----END PUBLIC KEY-----"
  AUTHENTICATE {
    IF $token.iss != "https://clerk.mervik.ru" {
      THROW "Invalid Clerk issuer";
    };
    IF $token.aud != "nuxtgram-surrealdb" {
      THROW "Invalid Clerk audience";
    };
    RETURN SELECT VALUE id FROM users WHERE clerkId = $token.sub LIMIT 1;
  };

-- Cascade deletes run as the database owner (permissions are bypassed inside
-- events), matching the legacy Payload hooks: deleting a post removes its
-- comments and every reaction on it; deleting a comment removes its reactions.
DEFINE EVENT IF NOT EXISTS cascade_post_delete ON TABLE posts
  WHEN $event = "DELETE"
  THEN {
    DELETE comments WHERE post = $value.id;
    DELETE post_reactions WHERE out = $value.id;
  };

DEFINE EVENT IF NOT EXISTS cascade_comment_delete ON TABLE comments
  WHEN $event = "DELETE"
  THEN {
    DELETE comment_reactions WHERE out = $value.id;
  };
