"use client";

import { useState, useEffect } from "react";
import { BookType, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { adminAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface WordItem {
  id: number;
  word: string;
}

export default function WordsManagementPage() {
  const [words, setWords] = useState<WordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newWord, setNewWord] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WordItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchWords = async () => {
    setIsLoading(true);
    try {
      const data = await adminAPI.getWords();
      setWords(data);
    } catch {
      toast.error("Failed to load word dictionary");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    const word = newWord.trim().toUpperCase();
    if (word.length !== 5) {
      toast.error("Word must be exactly 5 letters");
      return;
    }
    if (!/^[A-Z]{5}$/.test(word)) {
      toast.error("Word must contain only letters");
      return;
    }

    setIsAdding(true);
    try {
      await adminAPI.addWord(word);
      toast.success(`Word "${word}" added to dictionary`);
      setNewWord("");
      fetchWords();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add word");
    } finally {
      setIsAdding(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminAPI.deleteWord(deleteTarget.id);
      toast.success(`Word "${deleteTarget.word}" removed`);
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchWords();
    } catch {
      toast.error("Failed to delete word");
    }
  };

  const filteredWords = words.filter((w) =>
    w.word.includes(search.toUpperCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-[var(--font-heading)] font-bold tracking-tight bg-gradient-to-r from-[#6aaa64] to-[#4e9048] bg-clip-text text-transparent">
            Word Dictionary
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage the list of valid 5-letter words for the game.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#6aaa64]/30 bg-[#6aaa64]/10 px-4 py-1.5 text-sm font-medium text-[#4e7a48]">
          <BookType className="h-4 w-4" />
          <span className="font-bold tabular-nums">{words.length}</span>
          words
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Add Word Form */}
        <Card className="md:col-span-1 border-border/50 bg-card/40 h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#6aaa64]" />
              Add New Word
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddWord} className="space-y-4">
              <label className="text-sm text-muted-foreground block">5-Letter Word</label>
              {/* The tiles ARE the input: a transparent field overlays them and captures typing. */}
              <label className="relative block cursor-text">
                <input
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  maxLength={5}
                  autoComplete="off"
                  autoCapitalize="characters"
                  aria-label="5-letter word"
                  disabled={isAdding}
                  className="absolute inset-0 h-full w-full cursor-text opacity-0"
                />
                <div className="flex justify-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const active = isFocused && i === Math.min(newWord.length, 4);
                    return (
                      <div
                        key={i}
                        className={`flex h-12 w-12 items-center justify-center rounded-md border-2 font-mono text-xl font-bold uppercase transition-all ${
                          newWord[i]
                            ? "border-[#6aaa64] bg-[#6aaa64] text-white"
                            : "border-border bg-background text-muted-foreground"
                        } ${active ? "border-[#6aaa64] ring-2 ring-[#6aaa64]/40" : ""}`}
                      >
                        {newWord[i] ?? (active ? <span className="animate-pulse text-[#6aaa64]">|</span> : "")}
                      </div>
                    );
                  })}
                </div>
              </label>
              <p className="text-xs text-muted-foreground">
                Uppercase A–Z only · {newWord.length}/5
              </p>
              <Button
                type="submit"
                className="w-full bg-[#6aaa64] hover:bg-[#5c9656] text-white"
                disabled={isAdding || newWord.length !== 5}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding…
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Word
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Word List */}
        <Card className="md:col-span-2 border-border/50 bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/50">
            <CardTitle className="text-lg">Dictionary</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search words..."
                className="pl-9 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-6 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#6aaa64]" />
              </div>
            ) : filteredWords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                <BookType className="h-12 w-12 mb-4 opacity-20" />
                {search ? `No words found matching "${search}"` : "No words in dictionary yet."}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {filteredWords.map((w) => (
                  <div
                    key={w.id}
                    className="group inline-flex items-center gap-2 rounded-full border border-[#6aaa64]/30 bg-[#6aaa64]/10 py-1.5 pl-3.5 pr-1.5 text-sm font-mono font-semibold tracking-wider text-[#4e7a48] transition-colors hover:border-[#6aaa64]/60 hover:bg-[#6aaa64]/15"
                  >
                    {w.word}
                    <button
                      onClick={() => { setDeleteTarget(w); setIsDeleteDialogOpen(true); }}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[#6aaa64]/70 transition-colors hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Delete {w.word}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Word</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{deleteTarget?.word}&quot; from the dictionary?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Remove Word</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
