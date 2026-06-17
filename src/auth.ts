import NextAuth from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    {
      id: "trakt",
      name: "Trakt",
      type: "oauth",
      clientId: process.env.TRAKT_CLIENT_ID!,
      clientSecret: process.env.TRAKT_CLIENT_SECRET!,
      authorization: {
        url: "https://trakt.tv/oauth/authorize",
        params: { response_type: "code" },
      },
      token: "https://api.trakt.tv/oauth/token",
      userinfo: {
        url: "https://api.trakt.tv/users/me",
        async request({ tokens }: { tokens: { access_token?: string } }) {
          const res = await fetch("https://api.trakt.tv/users/me", {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              "trakt-api-version": "2",
              "trakt-api-key": process.env.TRAKT_CLIENT_ID!,
              "Content-Type": "application/json",
            },
          });
          return res.json();
        },
      },
      profile(profile) {
        return {
          id: profile.username,
          name: profile.name || profile.username,
          email: profile.username + "@trakt.local",
          image: profile.images?.avatar?.full,
          username: profile.username,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.traktUsername = token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.traktUsername = token.traktUsername as string;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
