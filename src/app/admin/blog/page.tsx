
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, Loader2, AlertTriangle, Rss } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import type { BlogPost, BlogPostSection } from '@/types';
import { functions, db } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, query, orderBy, getDocs, doc, deleteDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription as DialogDesc } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';

// Correctly use the generic public file upload function
const uploadFile = httpsCallable(functions, 'uploadFile');

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};


export default function AdminBlogPage() {
    const { toast } = useToast();
    const { currentUser } = useAuth();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchBlogPosts = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, "blogPosts"), orderBy("publicationDate", "desc"));
            const snapshot = await getDocs(q);
            const postsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                publicationDate: doc.data().publicationDate.toDate().toISOString(),
            } as BlogPost));
            setPosts(postsData);
        } catch (error) {
            console.error("Error fetching blog posts:", error);
            toast({ title: "Error", description: "Could not fetch blog posts.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchBlogPosts();
    }, []);

    const handleAddNew = () => {
        setCurrentPost(null);
        setIsModalOpen(true);
    };

    const handleEdit = (post: BlogPost) => {
        setCurrentPost(post);
        setIsModalOpen(true);
    };

    const handleDelete = async (postId: string) => {
        try {
            await deleteDoc(doc(db, "blogPosts", postId));
            toast({ title: "Success", description: "Blog post deleted successfully." });
            fetchBlogPosts();
        } catch (error) {
            console.error("Error deleting post:", error);
            toast({ title: "Error", description: "Could not delete blog post.", variant: "destructive" });
        }
    };
    
    return (
        <>
            <PageHeader title="Manage Blog" description="Create, edit, and manage blog posts for your users." />
             <div className="mb-6 text-right">
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Post
                </Button>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>All Blog Posts</CardTitle>
                    <CardDescription>You have {posts.length} blog posts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Publication Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                            ) : posts.length > 0 ? posts.map(post => (
                                <TableRow key={post.id}>
                                    <TableCell className="font-medium">{post.title}</TableCell>
                                    <TableCell>
                                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className={post.status === 'published' ? 'bg-green-500' : ''}>
                                            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(post.publicationDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(post)}><Edit className="h-4 w-4" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the post "{post.title}".</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(post.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={4} className="text-center h-24">No blog posts found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {isModalOpen && (
                <BlogPostFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    post={currentPost}
                    onSave={fetchBlogPosts}
                    authorName={currentUser?.name || 'Admin'}
                />
            )}
        </>
    );
}

interface BlogPostFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: BlogPost | null;
    onSave: () => void;
    authorName: string;
}

function BlogPostFormModal({ isOpen, onClose, post, onSave, authorName }: BlogPostFormModalProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
    const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(post?.bannerImageUrl || null);
    const [sections, setSections] = useState<BlogPostSection[]>(post?.sections || []);
    
    const [title, setTitle] = useState(post?.title || '');
    const [summary, setSummary] = useState(post?.summary || '');
    const [isPublished, setIsPublished] = useState(post?.status === 'published');
    const [slug, setSlug] = useState(post?.slug || '');

    const handleAddSection = (type: 'text' | 'image') => {
        if (type === 'text') {
            setSections([...sections, { type: 'text', content: '' }]);
        } else {
             setSections([...sections, { type: 'image', title: '', imageUrl: '', imageHint: '' }]);
        }
    };

    const handleRemoveSection = (index: number) => {
        setSections(sections.filter((_, i) => i !== index));
    };

    const handleSectionChange = (index: number, field: keyof BlogPostSection, value: string) => {
        const newSections = [...sections];
        const section = newSections[index];
        (section as any)[field] = value;
        setSections(newSections);
    };
    
    const handleImageUploadForSection = async (index: number, file: File) => {
        if (!file) return;
        setIsSubmitting(true);
        try {
            const fileDataUrl = await fileToBase64(file);
            const result: any = await uploadFile({ fileName: file.name, fileDataUrl, folder: 'blog_sections' });
            if (result.data.downloadURL) {
                handleSectionChange(index, 'imageUrl', result.data.downloadURL);
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            toast({ title: "Error", description: "Image upload failed.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        let finalBannerUrl = post?.bannerImageUrl || bannerImagePreview;

        try {
            if (bannerImageFile) {
                const fileDataUrl = await fileToBase64(bannerImageFile);
                const result: any = await uploadFile({ fileName: bannerImageFile.name, fileDataUrl, folder: 'blog_banners' });
                if (result.data.downloadURL) {
                    finalBannerUrl = result.data.downloadURL;
                } else {
                    throw new Error('Banner upload failed');
                }
            }

            if (!finalBannerUrl) {
                toast({ title: "Validation Error", description: "A banner image is required.", variant: "destructive" });
                setIsSubmitting(false);
                return;
            }

            const finalSlug = slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

            const postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'publicationDate'> = {
                title,
                slug: finalSlug,
                summary,
                author: authorName,
                bannerImageUrl: finalBannerUrl,
                sections,
                status: isPublished ? 'published' : 'draft',
            };

            if (post) {
                await setDoc(doc(db, "blogPosts", post.id), { ...postData, updatedAt: serverTimestamp() }, { merge: true });
            } else {
                await addDoc(collection(db, "blogPosts"), { ...postData, publicationDate: serverTimestamp(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
            }
            
            toast({ title: "Success", description: `Blog post ${post ? 'updated' : 'created'} successfully.` });
            onSave();
            onClose();

        } catch (error) {
            console.error("Error saving blog post:", error);
            toast({ title: "Error", description: "Could not save the blog post.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{post ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
                    <DialogDesc>Fill in the details for your blog post below.</DialogDesc>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <ScrollArea className="max-h-[70vh] p-4 pr-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label htmlFor="title">Title</Label><Input id="title" value={title} onChange={e => setTitle(e.target.value)} required /></div>
                                <div><Label htmlFor="slug">URL Slug</Label><Input id="slug" value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g., my-first-blog-post" /></div>
                            </div>
                            <div><Label htmlFor="summary">Summary</Label><Textarea id="summary" value={summary} onChange={e => setSummary(e.target.value)} required /></div>
                            <div><Label htmlFor="bannerImage">Banner Image</Label><Input id="bannerImage" type="file" accept="image/*" onChange={e => {
                                if (e.target.files?.[0]) {
                                    setBannerImageFile(e.target.files[0]);
                                    setBannerImagePreview(URL.createObjectURL(e.target.files[0]));
                                }
                            }} />
                            {bannerImagePreview && <Image src={bannerImagePreview} alt="Banner preview" width={200} height={100} className="mt-2 rounded-md border" />}
                            </div>
                            <div className="flex items-center space-x-2"><Switch id="isPublished" checked={isPublished} onCheckedChange={setIsPublished} /><Label htmlFor="isPublished">Publish Post</Label></div>
                            
                            <div className="space-y-4 rounded-md border p-4">
                                <h3 className="font-medium">Content Sections</h3>
                                {sections.map((section, index) => (
                                    <div key={index} className="space-y-2 border p-3 rounded-md relative">
                                        <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => handleRemoveSection(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                        <Label>Section {index + 1}: {section.type === 'text' ? 'Text' : 'Image'}</Label>
                                        {section.type === 'text' ? (
                                            <Textarea value={section.content} onChange={e => handleSectionChange(index, 'content', e.target.value)} placeholder="Use Markdown for headings (#) and horizontal lines (---)." rows={5} />
                                        ) : (
                                            <div>
                                                <Input value={section.title} onChange={e => handleSectionChange(index, 'title', e.target.value)} placeholder="Image Title (for context)" />
                                                <Input type="file" accept="image/*" className="mt-2" onChange={e => { if(e.target.files?.[0]) handleImageUploadForSection(index, e.target.files[0])}}/>
                                                {section.imageUrl && <Image src={section.imageUrl} alt="Section image" width={150} height={100} className="mt-2 rounded-md border" />}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div className="space-x-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddSection('text')}><PlusCircle className="mr-2 h-4 w-4"/> Add Text Section</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddSection('image')}><PlusCircle className="mr-2 h-4 w-4"/> Add Image Section</Button>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="pt-4 mt-4 border-t">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {post ? 'Save Changes' : 'Create Post'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

    