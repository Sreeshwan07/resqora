import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, PhoneCall, Save, ShieldOff, UserRound } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { MedicalIdCard } from "@/components/aegis/medical-id-card";
import { GuardianCard } from "@/components/aegis/guardian-card";
import { SafetyScoreCard } from "@/components/aegis/safety-score-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { computeSafetyScore, contactsQuery, profileQuery } from "@/lib/api";
import { copyText } from "@/lib/alerts";
import { ensureMedicalShareLink, revokeShareLink, shareUrl } from "@/lib/share";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Your profile & medical ID — AEGIS" },
      {
        name: "description",
        content:
          "Manage your AEGIS personal details, medical ID and the three trusted contacts we alert in an emergency.",
      },
      { property: "og:title", content: "AEGIS Profile & Medical ID" },
      { property: "og:description", content: "Personal details, medical ID and trusted contacts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

type ContactDraft = {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
};

function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profile = useQuery(profileQuery(user?.id));
  const contacts = useQuery(contactsQuery(user?.id));
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    current_city: "",
    home_address: "",
    blood_group: "",
    allergies: "",
    medical_conditions: "",
    medications: "",
  });
  const [drafts, setDrafts] = useState<ContactDraft[]>([]);

  useEffect(() => {
    if (!profile.data) return;
    setForm({
      full_name: profile.data.full_name ?? "",
      phone: profile.data.phone ?? "",
      date_of_birth: profile.data.date_of_birth ?? "",
      gender: profile.data.gender ?? "",
      current_city: profile.data.current_city ?? "",
      home_address: profile.data.home_address ?? "",
      blood_group: profile.data.blood_group ?? "",
      allergies: profile.data.allergies ?? "",
      medical_conditions: profile.data.medical_conditions ?? "",
      medications: profile.data.medications ?? "",
    });
  }, [profile.data]);

  useEffect(() => {
    const base: ContactDraft[] = (contacts.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      relationship: c.relationship,
      phone: c.phone,
      email: c.email ?? "",
    }));
    while (base.length < 3) base.push({ name: "", relationship: "", phone: "", email: "" });
    setDrafts(base.slice(0, 3));
  }, [contacts.data]);

  const score = computeSafetyScore(
    { ...(profile.data ?? {}), ...form } as never,
    (contacts.data ?? []) as never,
  );

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim() || null,
        phone: form.phone.trim() || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        current_city: form.current_city.trim() || null,
        home_address: form.home_address.trim() || null,
        blood_group: form.blood_group || null,
        allergies: form.allergies.trim() || null,
        medical_conditions: form.medical_conditions.trim() || null,
        medications: form.medications.trim() || null,
        safety_score: score,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries();
    toast.success("Profile updated");
  }

  async function saveContacts() {
    if (!user) return;
    if (drafts.some((c) => !c.name.trim() || !c.relationship.trim() || c.phone.trim().length < 7)) {
      toast.error("All three contacts need a name, relationship and phone number");
      return;
    }
    setSaving(true);
    await supabase.from("emergency_contacts").delete().eq("user_id", user.id);
    const { error } = await supabase.from("emergency_contacts").insert(
      drafts.map((contact, index) => ({
        user_id: user.id,
        name: contact.name.trim(),
        relationship: contact.relationship.trim(),
        phone: contact.phone.trim(),
        email: contact.email.trim() || null,
        position: index,
      })),
    );
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries();
    toast.success("Emergency contacts updated");
  }

  return (
    <>
      <PageHeader
        icon={UserRound}
        title="Profile & medical ID"
        description="Keep this accurate — responders read it before they reach you."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="glass-panel rounded-3xl p-5 sm:p-6">
          <Tabs defaultValue="personal">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="medical">Medical</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
              <Field label="Phone" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <Field
                label="Date of birth"
                type="date"
                value={form.date_of_birth}
                onChange={(v) => setForm({ ...form, date_of_birth: v })}
              />
              <SelectField
                label="Gender"
                value={form.gender}
                onChange={(v) => setForm({ ...form, gender: v })}
                options={["Female", "Male", "Non-binary", "Prefer not to say"]}
              />
              <Field
                label="City"
                value={form.current_city}
                onChange={(v) => setForm({ ...form, current_city: v })}
              />
              <Field
                label="Home address"
                value={form.home_address}
                onChange={(v) => setForm({ ...form, home_address: v })}
              />
              <div className="sm:col-span-2">
                <Button variant="hero" onClick={saveProfile} disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save changes
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="medical" className="mt-6 grid gap-4">
              <SelectField
                label="Blood group"
                value={form.blood_group}
                onChange={(v) => setForm({ ...form, blood_group: v })}
                options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"]}
              />
              <AreaField
                label="Allergies"
                value={form.allergies}
                onChange={(v) => setForm({ ...form, allergies: v })}
              />
              <AreaField
                label="Medical conditions"
                value={form.medical_conditions}
                onChange={(v) => setForm({ ...form, medical_conditions: v })}
              />
              <AreaField
                label="Medications"
                value={form.medications}
                onChange={(v) => setForm({ ...form, medications: v })}
              />
              <div>
                <Button variant="hero" onClick={saveProfile} disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save medical ID
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="contacts" className="mt-6 space-y-5">
              <p className="rounded-2xl bg-info/10 px-4 py-3 text-sm text-info">
                AEGIS always keeps exactly three trusted contacts.
              </p>
              {drafts.map((contact, index) => (
                <div key={index} className="rounded-2xl border border-border bg-card/60 p-4">
                  <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <PhoneCall className="size-3.5" aria-hidden="true" />
                    Contact {index + 1}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Name"
                      value={contact.name}
                      onChange={(v) =>
                        setDrafts((prev) => prev.map((c, i) => (i === index ? { ...c, name: v } : c)))
                      }
                    />
                    <Field
                      label="Relationship"
                      value={contact.relationship}
                      onChange={(v) =>
                        setDrafts((prev) =>
                          prev.map((c, i) => (i === index ? { ...c, relationship: v } : c)),
                        )
                      }
                    />
                    <Field
                      label="Phone"
                      type="tel"
                      value={contact.phone}
                      onChange={(v) =>
                        setDrafts((prev) => prev.map((c, i) => (i === index ? { ...c, phone: v } : c)))
                      }
                    />
                    <Field
                      label="Email (for emergency emails)"
                      type="email"
                      value={contact.email}
                      onChange={(v) =>
                        setDrafts((prev) => prev.map((c, i) => (i === index ? { ...c, email: v } : c)))
                      }
                    />
                  </div>
                </div>
              ))}
              <Button variant="hero" onClick={saveContacts} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save contacts
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <SafetyScoreCard score={score} hints={[]} />
          <GuardianCard userId={user?.id} />
          <MedicalQrSection />
        </div>
      </div>
    </>
  );
}

/** Digital medical QR that opens the secure responder profile page. */
function MedicalQrSection() {
  const { user } = useAuth();
  const profile = useQuery(profileQuery(user?.id));
  const contacts = useQuery(contactsQuery(user?.id));
  const link = useQuery({
    queryKey: ["medical-share-link", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => ensureMedicalShareLink(user!.id),
  });

  const url = link.data && link.data.active ? shareUrl(link.data) : null;

  return (
    <div className="space-y-3">
      <MedicalIdCard
        profile={profile.data}
        contacts={contacts.data ?? []}
        showQr
        qrValue={url ?? undefined}
        qrCaption={
          url
            ? "Scanning this opens your secure emergency profile — blood group, allergies, conditions, medications, notes and trusted contacts. No login required."
            : undefined
        }
      />
      {url && (
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Secure profile link
          </p>
          <p className="mt-2 truncate rounded-xl bg-muted px-3 py-2 font-mono text-xs">{url}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await copyText(url);
                toast.success("Profile link copied");
              }}
            >
              <Copy className="size-4" />
              Copy link
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await revokeShareLink(link.data!.id);
                await logActivity(user?.id, "Profile updated", "Medical QR link revoked");
                toast.success("Link revoked — generate a new one any time");
                await link.refetch();
              }}
            >
              <ShieldOff className="size-4" />
              Revoke
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const id = `field-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl"
      />
    </div>
  );
}

function AreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `area-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 w-full rounded-xl">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}