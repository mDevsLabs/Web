/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — VIBEBOOKS API (books.ts)
 * Gestion des collections de livres, clubs de lecture et adhésions
 * ============================================================================
 */

import type {
  VibeBook,
  VibeBookMember,
  VibeBookPost,
} from "@/lib/vibe/types/vibe";
import { ApiServiceCore } from "./base";
import { ApiMaiService } from "./mai";

export class ApiBooksService extends ApiMaiService {
  public static async getBooks(postId?: string): Promise<{
    success: boolean;
    books: VibeBook[];
    maxBooks: number;
    ownedCount: number;
  }> {
    const qs = postId ? `?post_id=${encodeURIComponent(postId)}` : "";
    return ApiServiceCore.request(`/v1/books${qs}`);
  }

  public static async createBook(
    title: string,
    icon: string,
    isPublic = false
  ): Promise<{ success: boolean; book: VibeBook }> {
    ApiServiceCore.invalidateCache("/dms/");
    const body = JSON.stringify({ icon, is_public: isPublic, title });
    return ApiServiceCore.request("/v1/books", { body, method: "POST" });
  }

  public static async searchPublicBooks(q: string): Promise<{
    success: boolean;
    books: Array<{
      id: string;
      title: string;
      icon?: string;
      owner_username?: string;
      owner_display_name?: string;
      members_count?: number;
      items_count?: number;
    }>;
  }> {
    const qs = `?q=${encodeURIComponent(q)}`;
    return ApiServiceCore.request(`/v1/books/public${qs}`);
  }

  public static async updateBook(
    bookId: string,
    data: { title?: string; icon?: string; is_public?: boolean }
  ): Promise<{ success: boolean; book: VibeBook }> {
    const body = JSON.stringify(data);
    return ApiServiceCore.request(`/v1/books/${bookId}/update`, {
      body,
      method: "POST",
    });
  }

  public static async deleteBook(
    bookId: string
  ): Promise<{ success: boolean }> {
    ApiServiceCore.invalidateCache("/dms/");
    return ApiServiceCore.request(`/v1/books/${bookId}`, { method: "DELETE" });
  }

  public static async toggleBookItem(
    bookId: string,
    postId: string
  ): Promise<{ success: boolean; saved: boolean }> {
    return ApiServiceCore.request(`/v1/books/${bookId}/posts/${postId}`, {
      method: "POST",
    });
  }

  public static async getBookPosts(bookId: string): Promise<{
    success: boolean;
    book: VibeBook;
    members: VibeBookMember[];
    posts: VibeBookPost[];
  }> {
    return ApiServiceCore.request(`/v1/books/${bookId}/posts`);
  }

  public static async joinBook(
    code: string
  ): Promise<{ success: boolean; book: VibeBook; already_member?: boolean }> {
    ApiServiceCore.invalidateCache("/dms/");
    const body = JSON.stringify({ code });
    return ApiServiceCore.request("/v1/books/join", { body, method: "POST" });
  }

  public static async getBookMembers(
    bookId: string
  ): Promise<{ success: boolean; members: VibeBookMember[] }> {
    return ApiServiceCore.request(`/v1/books/${bookId}/members`);
  }

  public static async leaveBook(bookId: string): Promise<{ success: boolean }> {
    ApiServiceCore.invalidateCache("/dms/");
    return ApiServiceCore.request(`/v1/books/${bookId}/leave`, {
      method: "POST",
    });
  }

  public static async regenerateBookCode(
    bookId: string
  ): Promise<{ success: boolean; join_code: string }> {
    return ApiServiceCore.request(`/v1/books/${bookId}/regenerate-code`, {
      method: "POST",
    });
  }

  public static async pinBookPost(
    bookId: string,
    postId: string,
    pinned: boolean
  ): Promise<{ success: boolean; pinned: boolean }> {
    return ApiServiceCore.request(`/v1/books/${bookId}/posts/${postId}/pin`, {
      body: JSON.stringify({ pinned }),
      method: "POST",
    });
  }

  public static async kickBookMember(
    bookId: string,
    userId: string | number
  ): Promise<{ success: boolean; removed: number }> {
    ApiServiceCore.invalidateCache("/dms/");
    return ApiServiceCore.request(`/v1/books/${bookId}/members/${userId}`, {
      method: "DELETE",
    });
  }

  public static async transferBookOwnership(
    bookId: string,
    userId: string | number
  ): Promise<{ success: boolean; new_owner: number }> {
    ApiServiceCore.invalidateCache("/dms/");
    return ApiServiceCore.request(
      `/v1/books/${bookId}/members/${userId}/transfer-ownership`,
      { method: "POST" }
    );
  }
}
