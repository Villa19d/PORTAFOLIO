ALTER TABLE projects
    ADD COLUMN media jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN repos jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE projects
SET repos = jsonb_build_array(jsonb_build_object('url', repo_url))
WHERE repo_url IS NOT NULL AND repo_url <> '';