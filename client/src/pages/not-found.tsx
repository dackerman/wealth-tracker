import { Card, CardContent } from "@/components/ui/card";
import { AlertOctagon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import logoPath from "@/assets/logo.png";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--wealth-off-white)]">
      <div className="mb-8 flex items-center">
        <img src={logoPath} alt="WealthVision Logo" className="w-12 h-12 mr-3" />
        <h2 className="text-2xl font-bold wealth-gradient-text">WealthVision</h2>
      </div>
      
      <Card className="wealth-card w-full max-w-md mx-4 border-[var(--wealth-teal)] border-t-4">
        <CardContent className="pt-8 pb-8 flex flex-col items-center">
          <div className="bg-[var(--wealth-light-gray)]/30 p-4 rounded-full mb-4">
            <AlertOctagon className="h-12 w-12 text-[var(--wealth-teal)]" />
          </div>
          
          <h1 className="text-3xl font-bold text-[var(--wealth-dark-teal)] mb-2">404 Not Found</h1>
          
          <p className="mt-2 mb-6 text-[var(--wealth-slate)] text-center">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <Link href="/">
            <Button className="flex items-center bg-[var(--wealth-teal)] hover:bg-[var(--wealth-dark-teal)]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
