import Link from "next/link"
import { FileText } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 px-4 py-8 sm:px-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <FileText className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">Job Tracker</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage your job applications</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              id="email"
              placeholder="name@example.com"
              type="email"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="password"
              >
                Password
              </label>
              <Link className="text-sm text-primary underline-offset-4 hover:underline" href="#">
                Forgot password?
              </Link>
            </div>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              id="password"
              type="password"
            />
          </div>
          <Link
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            href="/"
          >
            Sign In
          </Link>
          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link className="text-primary underline-offset-4 hover:underline" href="/register">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
