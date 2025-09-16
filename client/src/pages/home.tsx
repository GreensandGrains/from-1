import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navbar from "@/components/navbar";
import HeroSearch from "@/components/hero-search";
import ServerCard from "@/components/server-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { usePageTitle } from "@/hooks/use-page-title";
import type { Server } from "@shared/schema";
import { AdBanner } from "@/components/ad-banner";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [contentType, setContentType] = useState<"servers" | "bots">("servers");
  const [sortBy, setSortBy] = useState("active");
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  usePageTitle("Home");

  // Fetch popular servers
  const { data: popularServers, isLoading: loadingPopular } = useQuery({
    queryKey: ["/api/servers/popular"],
  });

  // Fetch active/advertised servers
  const { data: allServers, isLoading: loadingServers } = useQuery({
    queryKey: ["/api/servers", "active"],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("sort", "active");
      params.set("limit", "6");
      params.set("offset", "0");
      
      const response = await fetch(`/api/servers?${params}`);
      if (!response.ok) throw new Error("Failed to fetch servers");
      return response.json();
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleJoinServer = (serverId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login with Discord to join servers.",
        variant: "destructive",
      });
      return;
    }

    // Find the server and redirect to Discord invite
    const allServersArray = Array.isArray(allServers) ? allServers : [];
    const popularServersArray = Array.isArray(popularServers) ? popularServers : [];
    const server = allServersArray.find((s: Server) => s.id === serverId) ||
                  popularServersArray.find((s: Server) => s.id === serverId);

    if (server?.inviteCode) {
      window.open(`https://discord.gg/${server.inviteCode}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HeroSearch onSearch={handleSearch} />

        {/* Header Ad */}
        <AdBanner position="header" className="mt-8" />
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Popular Servers Showcase */}

        {/* Top Active Discord Servers Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm animate-pulse"></div>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Top Active Discord Servers
              </h2>
            </div>
            <Button 
              variant="ghost" 
              className="text-primary hover:text-secondary transition-all duration-300 hover:scale-105"
              onClick={() => navigate('/explore')}
            >
              All Discord Servers
            </Button>
          </div>

          {loadingServers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-start space-x-4 mb-4">
                    <Skeleton className="w-16 h-16 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(Array.isArray(allServers) ? allServers.slice(0, 6) : []).map((server: Server) => (
                <ServerCard
                  key={server.id}
                  server={server}
                  onJoin={handleJoinServer}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a2e] border-t border-[#16213e] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img 
                  src="/assets/axiom-logo.png" 
                  width="32"
                  height="32"
                  alt="Axiom Logo" 
                  className="object-contain rounded-lg"
                  onError={(e) => {
                    console.error('Logo failed to load:', e);
                    e.currentTarget.style.display = 'block';
                  }}
                />
                <span className="font-bold text-xl text-white">Axiom</span>
              </div>
              <p className="text-gray-400">
                Smart communities, smarter connections. Discover the best Discord servers and bots for your community.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-white">Browse</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/explore" className="hover:text-purple-400 transition-colors">Discord Servers</a></li>
                <li><a href="/add-bot" className="hover:text-purple-400 transition-colors">Discord Bots</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Popular</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-white">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/help" className="hover:text-purple-400 transition-colors">Help Center</a></li>
                <li><a href="/contact-us" className="hover:text-purple-400 transition-colors">Contact Us</a></li>
                <li><a href="/terms-of-service" className="hover:text-purple-400 transition-colors">Terms of Service</a></li>
                <li><a href="/privacy-policy" className="hover:text-purple-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-white">Community</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/blog" className="hover:text-purple-400 transition-colors">Blog</a></li>
                <li><a href="https://discord.gg/axiom" className="hover:text-purple-400 transition-colors">Discord Server</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#16213e] mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Axiom. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}