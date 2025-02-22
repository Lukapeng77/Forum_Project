import { getTimeDif } from "../../utils/helpers.ts";
import { Comment as CommentType } from "../../utils/type.ts";
import { User } from "../post/User.tsx";
import { Arrows } from "../Arrows.tsx";
import { BiComment } from "react-icons/bi";
import { useEffect, useState } from "react";
import { CreateChildCommentForm } from "./CreateChildCommentForm.tsx";
import { useAuth } from "../../context/UseAuth";
import { useNavigate } from "react-router-dom";

type CommentProp = {
    comment: CommentType;
    fetchPosts: () => void;
};

const CommentComp: React.FC<CommentProp> = ({ comment, fetchPosts }) => {
    const { loggedIn } = useAuth()
    const [isCommentExpanded, setIsCommentExpanded] = useState<boolean>(false);
    const [childCompIndent, setChildCompIndent] = useState<number>(0);
    const navigate = useNavigate()


    const handleClick = () => {
        if (loggedIn) {
            setIsCommentExpanded(!isCommentExpanded);
        } else {
            navigate("/users")
        }

    };

    const handleIndentation = () => {
        const indentationAmount = comment.path.split("/");
        if (indentationAmount.length === 1) {
            setChildCompIndent(() => 0);
        } else {
            setChildCompIndent(() => indentationAmount.length);
        }
    };

    useEffect(() => {
        handleIndentation();
    }, []);
    return (
        <div
            className={`w-11/12 rounded-xl my-1 flex p-1 `}
            style={{
                paddingLeft: `${15 * childCompIndent}px`,
            }}
        >
            <Arrows
                postId={comment.postId}
                commentId={comment.id}
                type="comments"
                usersVote={comment.usersVoteStatus}
            />
            <div className="ml-2 col-start-2 w-full">
                <span className="text-gray-300 text-xs">
                    <h1 className="text-blue-300 text-xs inline">
                        <User
                            username={comment.author.userName}
                            id={String(comment.authorId)}
                        />
                    </h1>{" "}
                    <span>
                        {comment.upVotes} points {getTimeDif(comment.createdAt)}{" "}
                        ago
                    </span>
                </span>
                <p>{comment.message}</p>
                {isCommentExpanded ? (
                    <CreateChildCommentForm
                        comment={comment}
                        fetchPosts={fetchPosts}
                        handleClick={handleClick}
                    />
                ) : (
                    <button
                        onClick={handleClick}
                        className="flex items-center hover:bg-gray-200 font-bold text-gray-400 rounded-lg p-2 mt-2 mb-1"
                    >
                        <BiComment className="mr-1" /> Reply
                    </button>
                )}
            </div>
        </div>
    );
};
export default CommentComp;
