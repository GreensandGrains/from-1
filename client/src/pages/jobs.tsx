
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MapPin, Clock, DollarSign, Users, Briefcase } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface Job {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  userId: string;
  skills: string[];
  websiteUrl?: string;
  serverInviteLink?: string;
  currency: string[];
  contactInfo: string;
  location: string;
  salary?: string;
  company?: string;
  urgent?: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export default function Jobs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Fetch jobs from database
  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs", searchQuery, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory !== "all") params.append("type", selectedCategory);
      
      const response = await fetch(`/api/jobs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch jobs");
      return response.json();
    },
  });

  const categories = [
    { value: "all", label: "All Jobs" },
    { value: "job_needed", label: "Jobs Needed" },
    { value: "job_giving", label: "Jobs Available" },
  ];

  const filteredJobs = jobs;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Job Board
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Find Discord-related jobs and services. Post what you need or offer your skills.
            </p>
            
            {isAuthenticated && (
              <Button 
                onClick={() => navigate('/add-job')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Post Job
              </Button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category.value}
                    variant={selectedCategory === category.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.value)}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Jobs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow border-border bg-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{job.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4" />
                        {job.company || "Not specified"}
                      </CardDescription>
                    </div>
                    <Badge variant={job.type === "job_needed" ? "destructive" : "default"}>
                      {job.type === "job_needed" ? "Needed" : "Available"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {job.description}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span>{job.location}</span>
                      <Badge variant="outline" className="text-xs">
                        {job.category}
                      </Badge>
                    </div>
                    
                    {job.salary && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span>{job.salary}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {job.skills && job.skills.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Skills:</h4>
                      <div className="flex flex-wrap gap-1">
                        {job.skills.slice(0, 3).map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        if (job.contactInfo.includes('discord.com/users/') || job.contactInfo.match(/^\d+$/)) {
                          const userId = job.contactInfo.includes('discord.com/users/') 
                            ? job.contactInfo.split('/').pop() 
                            : job.contactInfo;
                          window.open(`https://discord.com/users/${userId}`, '_blank');
                        } else {
                          navigator.clipboard.writeText(job.contactInfo);
                          alert('Contact info copied to clipboard: ' + job.contactInfo);
                        }
                      }}
                    >
                      Contact
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        alert(`Job Details:\n\nTitle: ${job.title}\nCompany: ${job.company || 'Not specified'}\nLocation: ${job.location}\nDescription: ${job.description}\n\nSkills: ${job.skills?.join(', ') || 'None specified'}\n\nContact: ${job.contactInfo}`);
                      }}
                    >
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse border-border bg-card">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="w-full h-6 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search terms" : "Be the first to post a job"}
              </p>
              {isAuthenticated && (
                <Button onClick={() => navigate('/add-job')}>
                  Post First Job
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
