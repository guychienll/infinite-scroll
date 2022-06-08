import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import styled from "styled-components";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import qs from "query-string";
import "./server";
import "./index.scss";
import { FixedSizeList } from "react-window";
import { WindowScroller } from "react-virtualized";
import { PropagateLoader, ClimbingBoxLoader } from "react-spinners";

const STATUS = {
    idle: "idle",
    loading: "loading",
    success: "success",
    failed: "failed",
    end: "end",
};

const List = React.memo(
    React.forwardRef((props, ref) => {
        let gutter = 18;
        let itemSize = 242 + gutter;
        const [loading, setLoading] = useState(true);
        return (
            <FixedSizeList
                ref={ref}
                itemCount={props.posts.length}
                width="100%"
                height={itemSize * 15}
                itemSize={itemSize}
                className="post-list"
                itemData={props.posts}
            >
                {({ data, index, style, isScrolling }) => {
                    const post = data[index];
                    return (
                        <div
                            key={post.id}
                            style={{
                                ...style,
                                padding: "0 10px",
                                boxSizing: "border-box",
                            }}
                        >
                            <div className="post">
                                <div className="img">
                                    <ClimbingBoxLoader
                                        color="#36d7b7"
                                        loading={loading}
                                        size={15}
                                        css={{
                                            position: "absolute",
                                            top: "50%",
                                            left: "50%",
                                            transform: "translate(-50%,-50%)",
                                        }}
                                    />
                                    <img
                                        onLoad={() => {
                                            setLoading(false);
                                        }}
                                        style={{
                                            visibility: loading
                                                ? "hidden"
                                                : "visible",
                                        }}
                                        loading="lazy"
                                        src={post.image}
                                        alt="post-thumb"
                                    />
                                </div>
                                <div className="info">
                                    <h3>{post.title}</h3>
                                    <p>{post.desc}</p>
                                    <div className="fill" />
                                    <span>{post.date}</span>
                                </div>
                            </div>
                        </div>
                    );
                }}
            </FixedSizeList>
        );
    }),
    (prev, next) => {
        return JSON.stringify(prev) === JSON.stringify(next);
    }
);
List.displayName = "List";

function App() {
    const location = useLocation();
    const [posts, setPosts] = useState([]);
    const navigate = useNavigate();
    const [status, setStatus] = useState(STATUS.idle);
    const params = qs.parse(location.search ? location.search : "?page=1");
    const [query, setQuery] = useState(() => params);
    const paginator = useRef(null);
    const loading = useRef(false);
    const ref = useRef(null);
    const initialized = useRef(false);

    const observer = useRef(
        new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                const { isIntersecting } = entry;
                if (!isIntersecting || loading.current) {
                    return;
                }
                loading.current = true;
                setQuery((prev) => {
                    const _nextPage = (Number(prev.page) + 1).toString(10);
                    let _nextState = {
                        ...prev,
                        page: _nextPage,
                    };
                    navigate(
                        `${location.pathname}?${qs.stringify(_nextState)}`,
                        {
                            replace: true,
                        }
                    );
                    return _nextState;
                });
            },
            {
                root: document.querySelector(".post-list"),
            }
        )
    ).current;

    useEffect(() => {
        if (status === STATUS.idle) {
            observer.observe(paginator.current);
        }
    }, [observer, status]);

    useEffect(() => {
        (async () => {
            try {
                setStatus(STATUS.loading);
                const { page } = query;
                let pages;
                if (!initialized.current) {
                    pages = Array.from(
                        { length: Number(page) },
                        (_page, index) => {
                            return `${index + 1}`;
                        }
                    );
                } else {
                    pages = [`${page}`];
                }
                const responses = await Promise.all(
                    pages.map((_page) => {
                        const params = {
                            page: _page,
                        };
                        return fetch(`/api/posts?${qs.stringify(params)}`);
                    })
                );
                const result = await Promise.all(
                    responses.map((response) => response.json())
                );
                const last = [...result].pop();
                const data = result.reduce((acc, cur) => {
                    acc = acc.concat(cur.data);
                    return acc;
                }, []);
                const { hasNext } = last;
                setPosts((prev) => [...prev, ...data]);
                if (!hasNext) {
                    observer.disconnect();
                    setStatus(STATUS.end);
                    return;
                }
                loading.current = false;
                initialized.current = true;
                setStatus(STATUS.success);
            } catch (e) {
                setStatus(STATUS.failed);
                loading.current = false;
            }
        })();
    }, [observer, query]);

    return (
        <StyledContainer>
            <div className="content">
                <WindowScroller
                    onScroll={({ scrollTop }) => {
                        if (ref) {
                            ref.current.scrollTo(scrollTop);
                        }
                    }}
                >
                    {() => <div />}
                </WindowScroller>

                <List ref={ref} posts={posts} />

                <div className="paginator" ref={paginator} />

                {status === STATUS.loading && status !== STATUS.end && (
                    <PropagateLoader
                        color="#36d7b7"
                        loading={status === STATUS.loading}
                        size={15}
                    />
                )}
            </div>
        </StyledContainer>
    );
}

const StyledContainer = styled.div`
    width: 100%;
    background-color: #eee;
    & > .content {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 auto;
        max-width: 960px;
        padding: 100px 0;
        & .post-list {
            min-height: 100vh;
            padding: 30px 0;
            box-sizing: border-box;
            height: 100% !important;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            & .post {
                display: flex;
                box-sizing: border-box;
                padding: 20px;
                border: 1px #ddd solid;
                border-radius: 15px;
                margin-bottom: 15px;
                box-shadow: 3px 3px 10px #ddd;
                & > .img {
                    min-width: 200px;
                    min-height: 200px;
                    border-radius: 15px;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    & > img {
                        width: 100%;
                        height: 100%;
                        border-radius: 15px;
                    }
                }
                & > .info {
                    display: flex;
                    flex-direction: column;
                    padding: 0 10px;
                    & > .fill {
                        flex: 1;
                    }
                    letter-spacing: 1.1px;
                    line-height: 1.4rem;
                    & > h3 {
                    }
                    & > p {
                        font-size: 16px;
                        color: #777;
                    }
                    & > span {
                        align-self: flex-end;
                    }
                }
            }
        }
    }
`;

const root = document.querySelector("#root");
const r = createRoot(root);
r.render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
);
