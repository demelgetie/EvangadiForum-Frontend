import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../App";
import styles from "./Profile.module.css";

export default function Profile() {
  const { username: routeUsername } = useParams();
  const { token, username } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const isOwn = routeUsername === username;

  useEffect(() => {
    const load = async () => {
      const res = await axios.get(`/api/users/profile/${routeUsername}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data.profile);
      setBio(res.data.profile?.bio || "");
      setSkills(res.data.profile?.skills || "");
      setAvatarUrl(res.data.profile?.avatar_url || "");
    };
    load();
  }, [routeUsername, token]);

  const save = async (e) => {
    e.preventDefault();
    await axios.put(
      "/api/users/profile",
      { bio, skills, avatarUrl },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  const changePass = async (e) => {
    e.preventDefault();
    setPassMsg("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassMsg("Please fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg("New password and confirm password do not match");
      return;
    }
    try {
      const res = await axios.post(
        "/api/users/changePassword",
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPassMsg(res.data.msg || "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPassMsg(err.response?.data?.msg || "Something went wrong");
    }
  };

  return (
    <div className={styles.wrap}>
      <h2>{profile?.username}</h2>
      <div className={styles.grid}>
        <div>
          <div className={styles.section}>
            <div className={styles.label}>Avatar</div>
            <div className={styles.avatarWrap}>
              {avatarUrl || profile?.avatar_url ? (
                <img
                  alt="avatar"
                  className={styles.avatar}
                  src={avatarUrl || profile?.avatar_url}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {(profile?.username || "U").slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            {isOwn && (
              <>
                <div className={styles.label}>Avatar URL</div>
                <input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </>
            )}
            <div className={styles.label}>Bio</div>
            {isOwn ? (
              <form onSubmit={save} className={styles.form}>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
                <div className={styles.label}>Skills</div>
                <input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
                <button className={styles.primary}>Save</button>
              </form>
            ) : (
              <div className={styles.text}>{profile?.bio || ""}</div>
            )}
          </div>
        </div>
        <div>
          <div className={styles.section}>
            <div className={styles.label}>Reputation</div>
            <div className={styles.badges}>{profile?.reputation || 0}</div>
          </div>
          <div className={styles.section}>
            <div className={styles.label}>Stats</div>
            <div className={styles.text}>
              Questions: {profile?.stats?.questions || 0}
            </div>
            <div className={styles.text}>
              Answers: {profile?.stats?.answers || 0}
            </div>
          </div>
          {isOwn && (
            <div className={styles.section}>
              <div className={styles.label}>Change Password</div>
              <form onSubmit={changePass} className={styles.form}>
                <input
                  type="password"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button className={styles.primary}>Update Password</button>
              </form>
              {passMsg && <div className={styles.text}>{passMsg}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
