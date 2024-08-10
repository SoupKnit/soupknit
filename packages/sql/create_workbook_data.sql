-- worbook data
create table
  public.workbook_data (
    id uuid not null default extensions.uuid_generate_v4 (),
    project_id uuid not null,
    preview_data jsonb not null,
    files jsonb not null,
    created_at timestamp with time zone null default now(),
    updated_at timestamp with time zone null default now(),
    constraint workbook_data_pkey primary key (id),
    constraint workbooks_project_id_fkey foreign key (project_id) references projects (id) on delete cascade
  ) tablespace pg_default;

create index if not exists idx_workbook_data_workbook_id on public.workbook_data using btree (workbook_id) tablespace pg_default;