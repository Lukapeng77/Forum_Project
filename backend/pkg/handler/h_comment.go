package handler

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Lukapeng77/Forum_Project/pkg/database"
	"github.com/Lukapeng77/Forum_Project/pkg/models"
	"github.com/Lukapeng77/Forum_Project/pkg/utils"
)

type Comment struct {
	DB *pgxpool.Pool
}

func (c *Comment) Create(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*3)
	defer cancel()

	idStr := chi.URLParam(r, "id")
	post_id, err := strconv.Atoi(idStr)
	if err != nil {
		models.SendError(w, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	var payload models.CommentRequest

	err = json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		models.SendError(w, http.StatusInternalServerError, "Failed to decode payload", err)
		return
	}
	fmt.Printf("Comment: %+v", payload)
	cookie, customErr := utils.GetSessionCookie(r)
	if customErr != nil {
		models.SendError(w, customErr.StatusCode, customErr.Message, customErr.OriginalError)
		return
	}

	sessionToken := cookie.Value

	s, err := utils.ValidateSessionToken(ctx, c.DB, sessionToken)
	if err != nil {
		models.SendError(w, http.StatusUnauthorized, "Please login", err)
		return
	}
	var parentID sql.NullInt64

	if payload.Parent_ID == 0 {
		fmt.Println("Root level comment")
		parentID = sql.NullInt64{
			Int64: 0,
			Valid: false,
		}
	} else {
		fmt.Println("Child Comment")
		parentID = sql.NullInt64{
			Int64: payload.Parent_ID,
			Valid: true,
		}
	}

	err = database.AddComment(
		ctx,
		c.DB,
		int64(post_id),
		s.User_id,
		parentID,
		payload.Message,
		payload.Path,
	)
	if err != nil {
		models.SendError(
			w,
			http.StatusInternalServerError,
			"Failed to add comments to database",
			err,
		)
		return
	}

	utils.SendSuccessfulResp(w, "Comment Created")
}

func (c *Comment) List(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*3)
	defer cancel()

	idStr := chi.URLParam(r, "id")
	post_id := utils.ConvertID(idStr, w)

	cookie, customErr := utils.GetSessionCookie(r)
	if customErr != nil {
		if customErr.StatusCode == 401 {
			cookie = nil
		} else {
			models.SendError(w, customErr.StatusCode, customErr.Message, customErr.OriginalError)
			return
		}
	}

	user_id, err := utils.GetUserIdFromCookie(ctx, c.DB, cookie)
	if err != nil {
		models.SendError(w, http.StatusInternalServerError, "Failed to query database", err)
		return
	}

	comment_map, err := database.ListComments(ctx, c.DB, int64(post_id), user_id)
	if err != nil {
		models.SendError(
			w,
			http.StatusInternalServerError,
			"Failed to get comments from database",
			err,
		)
		return
	}

	for key, comments := range comment_map {
		fmt.Printf("Key: %s, Comments: [\n", key)
		for _, comment := range comments {
			fmt.Printf("\t%+v\n", comment)
		}
		fmt.Println("]")
	}
	var comments []models.CommentResp

	if rootComments, exists := comment_map["root"]; exists {
		for _, rc := range rootComments {
			nestedComment := utils.NestComments(rc, comment_map)
			comments = append(comments, nestedComment)

		}
	}

	data, err := json.Marshal(comments)
	if err != nil {
		models.SendError(w, http.StatusInternalServerError, "Failed to marshal data", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func (c *Comment) CommentVotes(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*3)
	defer cancel()

	commentID_str := chi.URLParam(r, "comment_id")
	vote_param := chi.URLParam(r, "vote")

	cookie, customErr := utils.GetSessionCookie(r)
	if customErr != nil {
		models.SendError(w, customErr.StatusCode, customErr.Message, customErr.OriginalError)
		return
	}

	userInfo, err := utils.ValidateSessionToken(ctx, c.DB, cookie.Value)
	if err != nil {
		models.SendError(w, http.StatusUnauthorized, "Could not validate user", err)
	}

	// convert id to int
	comment_id := utils.ConvertID(commentID_str, w)

	var vote bool
	if vote_param == "up-vote" {
		vote = true
	} else if vote_param == "down-vote" {
		vote = false
	} else {
		models.SendError(w, http.StatusBadRequest, "Bad URL", nil)
	}

	err = database.AddCommentVotes(ctx, c.DB, userInfo.User_id, int64(comment_id), vote)
	if err != nil {
		models.SendError(
			w,
			http.StatusInternalServerError,
			"Failed to get comments form database",
			err,
		)
		return
	}

	utils.SendSuccessfulResp(w, "Votes on Comments successful")
}
