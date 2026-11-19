import { courses } from "@/content/courses";
import type { User } from "@/lib/users";
import type { ClassRow } from "@/lib/lms";

/** The fields shared by "create a class" and "edit class". */
export function ClassFields({ teachers, cls, kind, course }: { teachers: User[]; cls?: ClassRow; kind?: string; course?: string }) {
  return (
    <>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="name">
          Class name
        </label>
        <input className="field" id="name" name="name" required maxLength={100} defaultValue={cls?.name ?? ""} placeholder="For example: Khan family, Qaida" />
      </div>
      <div>
        <label className="label" htmlFor="kind">
          Class type
        </label>
        <select className="field" id="kind" name="kind" defaultValue={cls?.kind ?? kind ?? "one"}>
          <option value="one">One-to-one</option>
          <option value="family">Family group (2 to 4)</option>
          <option value="community">Community group (3 to 6)</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="course">
          Course
        </label>
        <select className="field" id="course" name="course" defaultValue={cls?.course ?? course ?? ""}>
          <option value="">Not set</option>
          {courses.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="teacherId">
          Teacher
        </label>
        <select className="field" id="teacherId" name="teacherId" defaultValue={cls?.teacherId ?? ""}>
          <option value="">No teacher yet</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.gender || "gender not given"})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="schedule">
          Days and time
        </label>
        <input className="field" id="schedule" name="schedule" maxLength={200} defaultValue={cls?.schedule ?? ""} placeholder="Mon, Wed, Fri at 6:00pm London time" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="meetingUrl">
          Class link (Zoom, Google Meet…)
        </label>
        <input className="field" id="meetingUrl" name="meetingUrl" type="url" maxLength={400} defaultValue={cls?.meetingUrl ?? ""} placeholder="https://" pattern="https://.*" aria-describedby="link-hint" />
        <p id="link-hint" className="mt-1.5 text-[0.9rem] text-muted">
          Must start with https://. The family and the teacher see it as a “Join class” button.
        </p>
      </div>
    </>
  );
}
