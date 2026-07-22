function PrivacyPolicy() {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-10">
      <div className="max-w-3xl mx-auto bg-gray-900/75 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-white/85 afacad-light">
        <h1 className="afacad-bold text-white text-3xl mb-1">Privacy Policy</h1>
        <p className="text-white/50 text-sm mb-8">Last updated: 2026-07-22</p>

        <p className="mb-6">
          Re:muria is a small, personal Honkai: Star Rail companion project, self-hosted on a Raspberry Pi.
          It isn't a commercial product, there's no ad network, no analytics vendor, and no interest in your
          personal data beyond what's needed to make the login button work.
        </p>

        <h2 className="afacad-semi-bold text-white text-xl mt-8 mb-2">Cookies</h2>
        <p className="mb-4">
          Signing in uses Discord OAuth2. That login flow sets a session cookie (so the server remembers
          you're signed in) and a CSRF/XSRF token cookie (a security measure required to safely accept
          logout/rename/delete requests from your browser). Both are strictly necessary for the site to
          function and aren't used for tracking, advertising, or analytics of any kind.
        </p>

        <h2 className="afacad-semi-bold text-white text-xl mt-8 mb-2">What's stored, and where</h2>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <li>
            <span className="text-white">On our server:</span> if you sign in with Discord, we hold whatever
            Discord's OAuth2 flow provides (your Discord username and avatar) for as long as your session is
            active, plus any HSR UIDs you've verified ownership of.
          </li>
          <li>
            <span className="text-white">In your browser only (localStorage), never sent to us:</span> display
            preferences (theme, background, relic/build view options) and a short list of recently searched
            HSR UIDs, so they're there next time you open the site. This never leaves your device.
          </li>
        </ul>

        <h2 className="afacad-semi-bold text-white text-xl mt-8 mb-2">HSR game data</h2>
        <p className="mb-4">
          Character, relic, and build data shown on this site comes from the public Honkai: Star Rail profile
          you (or anyone) look up by UID, fetched through Enka.Network-style APIs. That's game data, not
          personal data about you.
        </p>

        <h2 className="afacad-semi-bold text-white text-xl mt-8 mb-2">No selling, no sharing, no third parties</h2>
        <p className="mb-4">
          Nothing collected here is sold, shared, or handed to third-party advertisers or analytics
          services, because there aren't any integrated into this site.
        </p>

        <h2 className="afacad-semi-bold text-white text-xl mt-8 mb-2">Questions</h2>
        <p>
          This is a hobby project. If something here concerns you, the simplest fix is to not sign in.
          Every search feature works without an account, and build data with builds hidden respects that
          on both the server and your own view.
        </p>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
