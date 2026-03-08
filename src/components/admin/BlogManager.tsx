import { useState } from "react";
import { blogPosts, type BlogPost } from "@/data/blogPosts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Eye, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const BlogManager = () => {
  const { toast } = useToast();
  const [posts] = useState<BlogPost[]>(blogPosts);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif">Blogginlägg</h1>
          <p className="text-muted-foreground mt-1">Hantera och skapa blogginlägg för SEO</p>
        </div>
        <Button onClick={() => toast({ title: "Kommer snart", description: "Bloggredigering via admin kräver databasintegration." })}>
          <Plus className="h-4 w-4 mr-2" /> Nytt inlägg
        </Button>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <Card key={post.slug}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <img src={post.heroImage} alt={post.title} className="w-24 h-16 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{post.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{post.date}</span>
                    <span>{post.readTime}</span>
                    <span className="text-primary font-medium">/blogg/{post.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <a href={`/blogg/${post.slug}`} target="_blank"><Eye className="h-4 w-4" /></a>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => toast({ title: "Kommer snart", description: "Redigering kräver databaslagring." })}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">Blogginlägg lagras i koden</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Just nu ligger blogginläggen i <code className="bg-muted px-1 rounded">src/data/blogPosts.ts</code>. 
            För att kunna skapa och redigera inlägg direkt i admin behöver vi flytta dem till databasen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
