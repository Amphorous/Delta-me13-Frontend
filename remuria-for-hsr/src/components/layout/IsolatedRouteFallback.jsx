// Per-route errorElement for routes that lazy-load something an ad blocker
// might target. A per-route errorElement only replaces what that route
// would have rendered in place of RootLayout's <Outlet />, so a failure here
// can never take out Header/Footer/the rest of the app — unlike the root
// "/" route's own errorElement (ErrorPage), which would.
function IsolatedRouteFallback() {
  return (
    <div className="flex-1 flex items-center justify-center p-10">
      <p className="afacad-light text-white/50 text-sm text-center">
        This page couldn't load — an ad blocker or extension may be interfering.
        The rest of the site is unaffected.
      </p>
    </div>
  );
}

export default IsolatedRouteFallback;
