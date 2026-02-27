/**
 * Member API Service
 * Handles household member management, invites, and access control
 */

import { apiGet, apiPost, apiDelete, ApiResponse } from "./api";
import { API_ENDPOINTS } from "./config";
import { Member } from "@/types";

export interface InviteMemberData {
  email: string;
}

export interface MemberInvite {
  OHID: string;
  householdId: string;
  householdName: string;
  invitedById: string;
  invitedByName: string;
  inviteEmail: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

/**
 * Get all members of a household
 */
export const getHouseholdMembers = async (
  householdId: string
): Promise<ApiResponse<Member[]>> => {
  return apiGet<Member[]>(API_ENDPOINTS.MEMBERS.LIST(householdId));
};

/**
 * Get specific member
 */
export const getMember = async (
  householdId: string,
  OHID: string
): Promise<ApiResponse<Member>> => {
  return apiGet<Member>(API_ENDPOINTS.MEMBERS.GET(householdId, OHID));
};

/**
 * Invite member to household via email
 */
export const inviteMemberToHousehold = async (
  householdId: string,
  data: InviteMemberData
): Promise<ApiResponse<{ inviteId: string }>> => {
  return apiPost<{ inviteId: string }>(
    API_ENDPOINTS.MEMBERS.INVITE(householdId),
    data
  );
};

/**
 * Accept household invite
 */
export const acceptHouseholdInvite = async (
  inviteId: string
): Promise<ApiResponse<Member>> => {
  return apiPost<Member>(
    API_ENDPOINTS.MEMBERS.ACCEPT_INVITE(inviteId)
  );
};

/**
 * Decline household invite
 */
export const declineHouseholdInvite = async (
  inviteId: string
): Promise<ApiResponse<void>> => {
  return apiPost<void>(API_ENDPOINTS.MEMBERS.DECLINE_INVITE(inviteId));
};

/**
 * Remove member from household
 */
export const removeMemberFromHousehold = async (
  householdId: string,
  memberOHID: string
): Promise<ApiResponse<void>> => {
  return apiDelete<void>(
    API_ENDPOINTS.MEMBERS.REMOVE(householdId, memberOHID)
  );
};

/**
 * Get pending invites for current user
 */
export const getPendingInvites = async (): Promise<
  ApiResponse<MemberInvite[]>
> => {
  return apiGet<MemberInvite[]>("/members/invites?status=pending");
};

/**
 * Leave household
 */
export const leaveHousehold = async (
  householdId: string
): Promise<ApiResponse<void>> => {
  // Get current user ID from auth
  // Then remove self from household
  // This should be implemented based on your auth store
  return apiDelete<void>(
    API_ENDPOINTS.MEMBERS.REMOVE(householdId, "current")
  );
};
