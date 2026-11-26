import Link from 'next/link';
import { notFound } from 'next/navigation';
import { staffState } from '@/lib/staff';
import { companyAdmin, listCompaniesForPicker, projectPicker } from '@/lib/partners';
import StaffActionForm from '@/components/staff/StaffActionForm';
import { ProjectError } from '@/lib/projects';
import StaffGate from '@/components/staff/StaffGate';
import StaffNav from '@/components/staff/StaffNav';
import StaffButton from '@/components/staff/StaffButton';
import CompanyEditor from '@/components/staff/CompanyEditor';
import CollaborationForm, { EMPTY_COLLABORATION } from '@/components/staff/CollaborationForm';

export const dynamic = 'force-dynamic';

const FIELD_LABEL: Record<string, string> = {
  name: 'Name',
  website: 'Website',
  domain: 'Web address',
  description: 'Description',
  sector: 'Sector',
  keywords: 'Keywords',
  location: 'Location',
};
const VIS_LABEL = { public: 'Public', limited: 'Limited (anonymized)', private: 'Private (staff only)' } as const;
const date = (iso: string) => new Date(iso).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Toronto' });

/** Review, correct and publish one company, see where its details came from, and manage its collaborations. */
export default async function CompanyAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { state } = await staffState();
  if (state !== 'staff') return <StaffGate state={state} />;
  const { id } = await params;
  let data;
  try {
    data = await companyAdmin(id);
  } catch (err) {
    if (err instanceof ProjectError && err.status === 404) notFound();
    throw err;
  }
  const [projects, allCompanies] = await Promise.all([projectPicker(), listCompaniesForPicker(false)]);
  const { company, imports, collaborations, partnerProjects } = data;
  const mergedInto = (company as { merged_into?: string | null }).merged_into ?? null;
  const others = allCompanies.filter((c) => c.id !== company.id);
  const sameDomain = others.filter((c) => company.domain && c.domain === company.domain);
  const published = company.status === 'published';
  const saved = (await searchParams).saved === '1';
  const card = 'space-y-3 rounded-2xl border border-line bg-white p-5 sm:p-6';
  const prov = Object.entries(company.provenance ?? {});

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <StaffNav />
      <div>
        <h1 className="break-words text-3xl font-extrabold">{company.name}</h1>
        <p className="text-sm text-muted">
          {published ? (
            <>
              Published ·{' '}
              <Link href={`/partners/${company.id}`} className="underline">
                view public page
              </Link>
            </>
          ) : (
            'Draft – not visible to the public'
          )}
        </p>
      </div>
      {mergedInto && (
        <p className="rounded-lg bg-amber-50 p-3">
          This company was merged into{' '}
          <Link className="font-semibold underline" href={`/staff/companies/${mergedInto}`}>
            {mergedInto}
          </Link>
          . Its old public link redirects there.
        </p>
      )}
      {!mergedInto && sameDomain.length > 0 && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm">
          <strong>Possible duplicate:</strong> {sameDomain.map((c) => `${c.name} (${c.id})`).join(', ')} has the same website. If it is the same company,{' '}
          <a href="#merge" className="underline">
            merge them
          </a>
          .
        </p>
      )}
      {saved && <p className="rounded-lg bg-emerald-50 p-3 text-sm font-medium">Saved as a draft. Check the details, then publish when ready.</p>}

      <section className={card} aria-labelledby="pub-h">
        <h2 id="pub-h" className="text-lg font-bold">
          Publish
        </h2>
        <p className="text-sm">
          {published
            ? 'Visitors can see this company on the Industry Partners page.'
            : 'Publishing shows this company on the Industry Partners page. Check the details below first. Importing from a website never publishes anything by itself.'}
        </p>
        <StaffButton
          url={`/api/staff/companies/${company.id}`}
          body={{ action: published ? 'unpublish' : 'publish' }}
          label={published ? 'Unpublish' : 'Publish company'}
          variant={published ? 'secondary' : 'primary'}
          confirm={published ? 'It will disappear from the public site. Its collaborations are kept.' : 'I checked the details and want visitors to see this company.'}
          done={published ? 'Unpublished.' : 'Published.'}
        />
      </section>

      <section className={card} aria-labelledby="details-h">
        <h2 id="details-h" className="text-lg font-bold">
          Company details
        </h2>
        <CompanyEditor
          companyId={company.id}
          published={published}
          initial={{
            name: company.name,
            website: company.website,
            description: company.description,
            sector: company.sector,
            keywords: (company.keywords ?? []).join(', '),
            location: company.location,
          }}
        />
      </section>

      <section className={card} aria-labelledby="source-h">
        <h2 id="source-h" className="text-lg font-bold">
          Where this information came from
        </h2>
        {prov.length === 0 ? (
          <p className="text-sm text-muted">Nothing recorded yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {prov.map(([field, src]) => (
              <li key={field}>
                <span className="font-semibold">{FIELD_LABEL[field] ?? field}:</span>{' '}
                {src.source === 'website' ? (
                  <>
                    from the website <span className="break-all">{src.url}</span> on {date(src.at)}
                  </>
                ) : src.edited ? (
                  <>
                    changed by staff on {date(src.at)} (the website <span className="break-all">{src.url}</span> said something different)
                  </>
                ) : (
                  <>entered by staff on {date(src.at)}</>
                )}
              </li>
            ))}
          </ul>
        )}
        {imports.length > 0 && (
          <>
            <h3 className="pt-2 font-bold">Website reads</h3>
            <ul className="space-y-1 text-sm">
              {imports.map((i) => (
                <li key={i.id}>
                  {date(i.fetched_at)} · <span className="break-all">{i.source_url}</span> · {i.ok ? 'read successfully' : `failed: ${i.error}`}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className={card} aria-labelledby="collab-h" id="collaborations">
        <h2 id="collab-h" className="text-lg font-bold">
          Collaborations ({collaborations.length})
        </h2>
        {collaborations.length === 0 && <p className="text-sm text-muted">None yet. Add the first one below.</p>}
        <ul className="space-y-2">
          {collaborations.map((c) => (
            <li key={c.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-line p-3">
              <span className="min-w-0">
                <span className="block break-words font-semibold">{c.title}</span>
                <span className="block text-sm text-muted">
                  {c.year_start == null ? 'Year not recorded' : c.year_end && c.year_end !== c.year_start ? `${c.year_start}–${c.year_end}` : c.year_start} · {c.status === 'current' ? 'Current' : 'Past'} ·{' '}
                  {VIS_LABEL[c.visibility]}
                </span>
                {c.projects.length > 0 && <span className="block text-sm">Projects: {c.projects.map((p) => p.title).join(', ')}</span>}
                {c.students.length > 0 && <span className="block text-sm">Students: {c.students.map((s) => s.name).join(', ')}</span>}
              </span>
              <Link href={`/staff/collaborations/${c.id}`} className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold">
                Edit
              </Link>
            </li>
          ))}
        </ul>
        <h3 className="pt-2 font-bold">Add a collaboration</h3>
        <CollaborationForm companyId={company.id} initial={EMPTY_COLLABORATION} projects={projects} />
      </section>

      <section className={card} aria-labelledby="pp-h">
        <h2 id="pp-h" className="text-lg font-bold">
          Projects with this partner
        </h2>
        <p className="text-sm text-muted">Official relationships you approved from student requests.</p>
        {partnerProjects.length === 0 ? (
          <p className="text-sm">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {partnerProjects.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-3 text-sm">
                <Link href={`/projects/${p.id}`} className="font-semibold underline">
                  {String(p.title)}
                </Link>
                <StaffButton
                  url={`/api/staff/projects/${p.id}`}
                  body={{ action: 'remove_partner', company_id: company.id }}
                  label="Remove relationship"
                  variant="danger"
                  confirm="The project will no longer list this company."
                  done="Removed."
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      {!mergedInto && others.length > 0 && (
        <section className={card} aria-labelledby="merge-h" id="merge">
          <h2 id="merge-h" className="text-lg font-bold">
            Merge a duplicate
          </h2>
          <p className="text-sm text-muted">
            If this is the same company as another one, merge it into the one you keep. Its collaborations and project relationships move there, and this
            company&apos;s public link redirects there.
          </p>
          <div className="max-w-md">
            <StaffActionForm
              url={`/api/staff/companies/${company.id}`}
              action="merge"
              name="merge_into"
              label="Company to keep"
              initial={sameDomain[0]?.id ?? others[0].id}
              options={others.map((c) => ({ value: c.id, label: `${c.name} (${c.id})${c.status === 'draft' ? ' – draft' : ''}` }))}
              submitLabel="Merge into that company"
              confirm="Merge this company into the one you chose? This company will be hidden."
              redirectField="merged_into"
                redirectBase="/staff/companies/"
            />
          </div>
        </section>
      )}
    </div>
  );
}
