import { Post as PostType } from "../../utils/type.ts";
import { shortenUrl, getTimeDif } from "../../utils/helpers.ts";
import { Link } from "react-router-dom";
import { User } from "./User.tsx";
import { Arrows } from "../Arrows.tsx";

export type PostProps = {
    post: PostType;
    index: number | null;
};

const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const proceed = window.confirm("This link may be auto-generated and may not lead to an actual site. Proceed?")
    if (!proceed) {
        e.preventDefault();
    }
}
export const PostComp: React.FC<PostProps> = ({ post, index }) => {
    return (
        <div className="flex h-24 px-2 gap-2 bg-white border border-gray-200 rounded-xl my-1 max-w-lg sm:gap-3 w-full sm:max-h-20">
            {index && (
                <div className="w-4 mr-2 col-start-1">
                    <p className="my-2 text-xl">{index}.</p>
                </div>
            )}

            <Arrows
                type="posts"
                usersVote={post.usersVoteStatus}
                commentId={0}
                postId={post.id}
            />

            <div
                className={`h-12 ${index ? "col-start-3 " : ""
                    } my-2 flex flex-col`}
            >
                <div className="flex">
                    <a
                        href={post.url}
                        onClick={handleClick}
                        className="font-bold transition duration-200 cursor-pointer break-words"

                    >
                        {post.title}

                        <p className="inline text-xs text-gray-400 ml-1">
                            ({shortenUrl(post.url)})
                        </p>
                    </a>
                </div>
                <div className="flex">
                    <p className="text-xs">
                        {post.upVotes ? post.upVotes : 0}{" "}
                        {post.upVotes === 1 ? "point" : "points"} posted{" "}
                        {getTimeDif(post.createdAt)} ago by{" "}
                        <User
                            username={post.author.userName}
                            id={String(post.authorId)}
                        />
                        {post.comments === undefined ||
                            post.comments === null ? (
                            <Link
                                to={`/posts/${post.id}`}
                                className="bg-gray-200 text-black whitespace-nowrap text-xxs ml-2 px-1  rounded-lg hover:bg-gray-400 transition duration-200 cursor-pointer"
                            >
                                0 Comments
                            </Link>
                        ) : (
                            <Link
                                to={`/posts/${post.id}`}
                                className="bg-gray-200 text-black whitespace-nowrap text-xxs ml-2 px-1  rounded-lg hover:bg-gray-400 transition duration-200 cursor-pointer"
                            >
                                {post.comments.length} comments
                            </Link>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PostComp;
