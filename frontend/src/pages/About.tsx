import { Card, Button, Input, Textarea } from '../components/ui';

export default function About() {
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    await fetch((import.meta as any).env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api/send` : 'http://localhost:4000/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `[Feedback] ${data.message}`, deviceId: 'web-client' })
    }).catch(() => {});
    alert('Feedback submitted (mock). Thank you!');
    e.currentTarget.reset();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <div className="font-semibold mb-2">Project Description</div>
        <p className="opacity-80 text-sm">
          Hybrid Li-Fi + Wi-Fi Communication System — a research-oriented platform combining visible light communication (Li-Fi) with traditional Wi-Fi for resilient data transmission. This demo showcases simulated telemetry, control interfaces, and real-time events via WebSockets.
        </p>
        <div className="mt-4 font-semibold">Team</div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {[1,2,3,4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <img src="/placeholder.jpg" alt="Team" className="w-10 h-10 rounded-full object-cover" />
              <div className="text-sm">
                <div className="font-medium">Member {i}</div>
                <a className="text-brand" href="#">@username</a>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="font-semibold mb-2">Contact / Feedback</div>
        <form onSubmit={submit} className="grid gap-2">
          <label className="text-sm">Your Name</label>
          <Input name="name" placeholder="Your name" required />
          <label className="text-sm">Email</label>
          <Input name="email" type="email" placeholder="you@example.com" required />
          <label className="text-sm">Message</label>
          <Textarea name="message" rows={4} placeholder="Your feedback" required />
          <div className="mt-2">
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}


