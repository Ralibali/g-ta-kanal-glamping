import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { blogPosts } from "@/data/blogPosts";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) return <Navigate to="/blogg" replace />;

  // Simple markdown-ish rendering: split by ## headings and paragraphs
  const renderContent = (content: string) => {
    const lines = content.trim().split("\n");
    const elements: JSX.Element[] = [];
    let imageIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith("## ")) {
        // Insert an image before every second heading if available
        if (imageIndex < post.images.length && elements.length > 2) {
          elements.push(
            <img
              key={`img-${imageIndex}`}
              src={post.images[imageIndex]}
              alt={line.replace("## ", "")}
              className="rounded-2xl w-full my-8"
              loading="lazy"
            />
          );
          imageIndex++;
        }
        elements.push(
          <h2
            key={`h-${i}`}
            className="font-serif text-2xl font-bold text-foreground mt-10 mb-4"
          >
            {line.replace("## ", "")}
          </h2>
        );
      } else if (line.startsWith("- **")) {
        elements.push(
          <li
            key={`li-${i}`}
            className="text-muted-foreground leading-relaxed ml-4"
            dangerouslySetInnerHTML={{
              __html: line
                .replace(/^- /, "")
                .replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground'>$1</strong>")
                .replace(/–/g, "–"),
            }}
          />
        );
      } else {
        elements.push(
          <p
            key={`p-${i}`}
            className="text-muted-foreground leading-relaxed mb-4"
            dangerouslySetInnerHTML={{
              __html: line.replace(
                /\*\*(.*?)\*\*/g,
                "<strong class='text-foreground'>$1</strong>"
              ),
            }}
          />
        );
      }
    }

    return elements;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-[50vh] md:h-[60vh]">
        <img
          src={post.heroImage}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="container max-w-3xl">
            <Link
              to="/blogg"
              className="inline-flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground/90 text-sm mb-4 transition-colors"
            >
              <ArrowLeft size={14} />
              Alla inlägg
            </Link>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight mb-4">
              {post.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-primary-foreground/60">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("sv-SE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {post.readTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="container max-w-3xl py-12 md:py-20">
        {renderContent(post.content)}
      </article>

      {/* CTA */}
      <div className="bg-primary py-16">
        <div className="container max-w-2xl text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            Sugen på att uppleva det själv?
          </h2>
          <p className="text-primary-foreground/60 mb-8">
            Boka din glampingvistelse vid Bergs Slussar och Göta kanal.
          </p>
          <Link
            to="/#boka"
            className="inline-block bg-accent text-accent-foreground px-10 py-4 rounded-full font-semibold hover:scale-105 transition-transform shadow-md"
          >
            Boka nu →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
