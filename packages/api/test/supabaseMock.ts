// A minimal, chainable stand-in for the supabase-js query builder used across
// these tests. It records every method call in the chain and defers the actual
// result to a `resolver(chain)` callback held on a mutable state object, so a
// single mocked `supabase` instance can be re-programmed per test.
//
// The builder is awaitable (thenable) so terminal calls like
// `.from(t).select().eq().in()` resolve, and `.single()` also returns a promise.

export type SupabaseChain = {
  table: string;
  ops: { method: string; args: unknown[] }[];
};

export type SupabaseState = {
  // Return { data, error } for a completed query chain.
  resolver: (chain: SupabaseChain) => { data?: unknown; error?: unknown };
  // supabase.auth.admin.deleteUser stub.
  authDeleteUser: (id: string) => Promise<{ error?: { status?: number; message?: string } | null }>;
  // Records every chain that reaches a terminal (await or .single()).
  calls: SupabaseChain[];
};

export function createSupabaseState(): SupabaseState {
  return {
    resolver: () => ({ data: null, error: null }),
    authDeleteUser: async () => ({ error: null }),
    calls: [],
  };
}

export function createSupabaseProxy(state: SupabaseState) {
  function makeBuilder(table: string) {
    const chain: SupabaseChain = { table, ops: [] };

    const resolve = () => {
      state.calls.push(chain);
      return Promise.resolve(state.resolver(chain));
    };

    const proxy: any = new Proxy(
      {},
      {
        get(_t, prop: string) {
          if (prop === "then") {
            // Make the builder awaitable — terminal chains without .single().
            const p = resolve();
            return p.then.bind(p);
          }
          return (...args: unknown[]) => {
            chain.ops.push({ method: prop, args });
            if (prop === "single" || prop === "maybeSingle") {
              return resolve();
            }
            return proxy;
          };
        },
      }
    );
    return proxy;
  }

  return {
    from: (table: string) => makeBuilder(table),
    auth: {
      admin: {
        deleteUser: (id: string) => state.authDeleteUser(id),
      },
    },
  };
}
