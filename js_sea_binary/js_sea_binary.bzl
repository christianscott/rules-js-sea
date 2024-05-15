def _js_sea_binary(ctx):
    args = ["--output={}".format(ctx.outputs.binary.path), "--entrypoint={}".format(ctx.file.entry_point.path)]
    for src in ctx.files.srcs:
        args.append(src.path)

    ctx.actions.run(
        executable = ctx.executable._build,
        inputs = ctx.files.srcs,
        outputs = [ctx.outputs.binary],
        arguments = args,
        env = {
            "BAZEL_BINDIR": ctx.bin_dir.path,
        },
        progress_message = "Building SEA for %s" % ctx.label,
    )

js_sea_binary = rule(
    implementation = _js_sea_binary,
    attrs = {
        "entry_point": attr.label(
            allow_single_file = True,
            mandatory = True,
        ),
        "srcs": attr.label_list(allow_files = True),
        "data": attr.label_list(allow_files = True),
        "_build": attr.label(
            default = "//js_sea_binary:build",
            executable = True,
            cfg = "exec",
        ),
    },
    outputs = {"binary": "%{name}.bin"},
)
